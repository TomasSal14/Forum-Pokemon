from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import User, Board, Post, Comment, Poll, PollAnswer, Message
from .serializers import (
    UserSerializer, BoardSerializer, PostSerializer, CommentSerializer,
    PollSerializer, PollAnswerSerializer, MessageSerializer,
)

from django.contrib.auth import authenticate



# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@api_view(['GET'])
def user_detail(request, pk):
    try:
        user = User.objects.get(pk=pk, state='active')
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    serializer = UserSerializer(user)
    return Response(serializer.data)


# ---------------------------------------------------------------------------
# Autenticação
# ---------------------------------------------------------------------------

@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not password:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email= email).exists():
        return Response({'error': "Email ja existe"}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username= username).exists():
        return Response({'error': "Username ja existe"}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username= username, email= email, password= password)
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username= username, password= password)
    
    if user == None:
        return Response({'error': "Dados inválidos"}, status= status.HTTP_401_UNAUTHORIZED)
    
    return Response(UserSerializer(user).data)


# ---------------------------------------------------------------------------
# Boards
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def boards_list(request):
    if request.method == 'GET':
        boards = Board.objects.filter(state='active')
        serializer = BoardSerializer(boards, many=True)
        return Response(serializer.data)

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
    board.state = 'deleted'
    board.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Posts por board
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
# Posts
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def posts_list(request):
    if request.method == 'GET':
        posts = Post.objects.filter(state='active')
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

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

    post.state = 'deleted'
    post.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def post_comments(request, pk):
    try:
        post = Post.objects.get(pk=pk)
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


# ---------------------------------------------------------------------------
# Polls
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def polls_list(request):
    if request.method == 'GET':
        polls = Poll.objects.filter(state__in=['open', 'closed'])
        return Response(PollSerializer(polls, many=True).data)

    serializer = PollSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def poll_detail(request, pk):
    try:
        poll = Poll.objects.get(pk=pk)
    except Poll.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    return Response(PollSerializer(poll).data)


@api_view(['POST'])
def poll_vote(request, pk):
    try:
        poll = Poll.objects.get(pk=pk, state='open')
    except Poll.DoesNotExist:
        return Response({'error': 'Poll não encontrada ou fechada.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PollAnswerSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def messages_list(request):
    if request.method == 'GET':
        messages = Message.objects.filter(state__in=['unread', 'read'])
        return Response(MessageSerializer(messages, many=True).data)

    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
def message_detail(request, pk):
    try:
        message = Message.objects.get(pk=pk)
    except Message.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(MessageSerializer(message).data)

    message.state = 'deleted'
    message.save()
    return Response(status=status.HTTP_204_NO_CONTENT)

