from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import User, Board, BoardMember, Post, Comment, Poll, PollOption, PollAnswer, Message
from .serializers import (
    UserSerializer, BoardSerializer, PostSerializer, CommentSerializer,
    PollSerializer, PollAnswerSerializer, MessageSerializer,
)

from django.contrib.auth import authenticate
from django.db.models import Q


# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------

def check_delete_permission(request, creator_id):
    """Return an error Response if the requester cannot delete this resource, else None."""
    user_id = request.query_params.get('user_id')
    user_profile = request.query_params.get('user_profile')
    if not user_id:
        return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
    if not (int(user_id) == creator_id or user_profile in ('mod', 'admin')):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    return None


def require_admin(request):
    """Return a 403 Response if the requester is not an admin, else None."""
    if request.query_params.get('admin_profile') != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    return None


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@api_view(['GET'])
def users_list(request):
    users = User.objects.filter(state='active')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def user_detail(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['GET'])
def user_content(request, pk):
    """Get user's posts, comments, and polls. Admins can see deleted content."""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    admin_id = request.query_params.get('admin_id')
    is_admin = admin_id and User.objects.filter(pk=admin_id, profile='admin').exists()

    posts_query = Post.objects.filter(creator_id=pk, board__state='active')
    comments_query = Comment.objects.filter(user_id=pk)
    polls_query = Poll.objects.filter(creator_id=pk)

    if not is_admin:
        posts_query = posts_query.filter(state='active')
        comments_query = comments_query.filter(state='active')
        polls_query = polls_query.filter(state='active')

    return Response({
        'posts': PostSerializer(posts_query, many=True).data,
        'comments': CommentSerializer(comments_query, many=True).data,
        'polls': PollSerializer(polls_query, context={'request': request}, many=True).data,
    })


@api_view(['PUT'])
def user_role(request, pk):
    """Promote a user to mod or demote back to user. Admin only."""
    denied = require_admin(request)
    if denied:
        return denied

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if user.profile == 'admin':
        return Response({'error': 'Cannot change admin role'}, status=status.HTTP_403_FORBIDDEN)

    role = request.data.get('role')
    if role not in ('user', 'mod'):
        return Response({'error': 'Role must be user or mod'}, status=status.HTTP_400_BAD_REQUEST)

    user.profile = role
    user.save()
    return Response(UserSerializer(user).data)


@api_view(['PUT'])
def user_ban(request, pk):
    """Ban or unban a user. Admin only."""
    denied = require_admin(request)
    if denied:
        return denied

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')  # 'ban' or 'unban'
    if action == 'ban':
        user.state = 'banned'
    elif action == 'unban':
        user.state = 'active'
    else:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    user.save()
    return Response(UserSerializer(user).data)


@api_view(['GET'])
def users_admin_list(request):
    """Get all users including banned. Admin only."""
    denied = require_admin(request)
    if denied:
        return denied

    users = User.objects.all().exclude(state='deleted')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not password:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if user.state == 'banned':
        return Response({'error': 'User is banned'}, status=status.HTTP_403_FORBIDDEN)

    return Response(UserSerializer(user).data)


# ---------------------------------------------------------------------------
# Boards
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def boards_list(request):
    if request.method == 'GET':
        user_id = request.query_params.get('user_id')
        boards = Board.objects.filter(state='active')
        if user_id:
            boards = boards.filter(
                Q(public=True) |
                Q(creator_id=user_id) |
                Q(members__user_id=user_id)
            ).distinct()
        else:
            boards = boards.filter(public=True)
        return Response(BoardSerializer(boards, many=True).data)

    serializer = BoardSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def board_detail(request, pk):
    try:
        board = Board.objects.get(pk=pk, state='active')
    except Board.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(BoardSerializer(board).data)

    if request.method == 'PUT':
        serializer = BoardSerializer(board, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — soft delete
    denied = check_delete_permission(request, board.creator_id)
    if denied:
        return denied
    board.state = 'deleted'
    board.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Posts by board
# ---------------------------------------------------------------------------

@api_view(['GET'])
def board_posts(request, pk):
    try:
        board = Board.objects.get(pk=pk, state='active')
    except Board.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    posts = board.posts.filter(state='active')
    return Response(PostSerializer(posts, many=True).data)


# ---------------------------------------------------------------------------
# Board members
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST', 'DELETE'])
def board_members(request, pk):
    try:
        board = Board.objects.get(pk=pk, state='active')
    except Board.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        members = User.objects.filter(board_memberships__board=board, state='active')
        return Response(UserSerializer(members, many=True).data)

    user_id = request.data.get('userId')
    target_user_id = request.data.get('targetUserId')

    if not user_id or not target_user_id:
        return Response({'error': 'userId and targetUserId are required'}, status=status.HTTP_400_BAD_REQUEST)

    if board.creator_id != int(user_id):
        return Response({'error': 'Only the board creator can manage members'}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.get(pk=target_user_id, state='active')
    except User.DoesNotExist:
        return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        _, created = BoardMember.objects.get_or_create(board=board, user=target_user)
        if not created:
            return Response({'error': 'User is already a member'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'status': 'member_added'}, status=status.HTTP_201_CREATED)

    deleted, _ = BoardMember.objects.filter(board=board, user=target_user).delete()
    if deleted == 0:
        return Response({'error': 'User is not a member'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def posts_list(request):
    if request.method == 'GET':
        posts = Post.objects.filter(state='active', board__state='active')
        return Response(PostSerializer(posts, many=True).data)

    serializer = PostSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def post_detail(request, pk):
    try:
        post = Post.objects.get(pk=pk, state='active')
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(PostSerializer(post).data)

    if request.method == 'PUT':
        serializer = PostSerializer(post, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — soft delete
    denied = check_delete_permission(request, post.creator_id)
    if denied:
        return denied
    post.state = 'deleted'
    post.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def post_comments(request, pk):
    try:
        post = Post.objects.get(pk=pk, state='active')
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        comments = post.comments.filter(state='active')
        return Response(CommentSerializer(comments, many=True).data)

    serializer = CommentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
def comment_detail(request, pk):
    try:
        comment = Comment.objects.get(pk=pk, state='active')
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CommentSerializer(comment).data)

    # DELETE — soft delete
    denied = check_delete_permission(request, comment.user_id)
    if denied:
        return denied
    comment.state = 'deleted'
    comment.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Polls
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def polls_list(request):
    if request.method == 'GET':
        polls = Poll.objects.filter(state__in=['open', 'closed'])
        return Response(PollSerializer(polls, many=True, context={'request': request}).data)

    serializer = PollSerializer(data=request.data)
    if serializer.is_valid():
        poll = serializer.save()
        options = request.data.get('options', [])
        for option in options:
            label = option.get('label') if isinstance(option, dict) else None
            if label:
                PollOption.objects.create(poll=poll, label=label)
        return Response(PollSerializer(poll, context={'request': request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
def poll_detail(request, pk):
    try:
        poll = Poll.objects.get(pk=pk, state__in=['open', 'closed'])
    except Poll.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(PollSerializer(poll, context={'request': request}).data)

    # DELETE — soft delete
    denied = check_delete_permission(request, poll.creator_id)
    if denied:
        return denied
    poll.state = 'deleted'
    poll.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def poll_vote(request, pk):
    try:
        poll = Poll.objects.get(pk=pk, state='open')
    except Poll.DoesNotExist:
        return Response({'error': 'Poll not found or closed'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PollAnswerSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def poll_close(request, pk):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        poll = Poll.objects.get(pk=pk)
    except Poll.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if poll.creator_id != int(user_id):
        return Response({'error': 'Only the poll creator can close it'}, status=status.HTTP_403_FORBIDDEN)

    poll.state = 'closed'
    poll.save()
    return Response(PollSerializer(poll, context={'request': request}).data)


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def messages_list(request):
    if request.method == 'GET':
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        messages = Message.objects.filter(
            Q(user_receiver_id=user_id) | Q(user_sent_it_id=user_id),
            state__in=['unread', 'read']
        ).order_by('creation_date', 'id')
        return Response(MessageSerializer(messages, many=True).data)

    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
def message_detail(request, pk):
    try:
        message = Message.objects.get(pk=pk, state__in=['unread', 'read'])
    except Message.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(MessageSerializer(message).data)

    message.state = 'deleted'
    message.save()
    return Response(status=status.HTTP_204_NO_CONTENT)
