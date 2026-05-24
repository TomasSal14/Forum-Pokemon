from rest_framework import serializers
from .models import User, Board, BoardMember, Post, Comment, Poll, PollOption, PollAnswer, Message


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'profile', 'state', 'date_joined']


class BoardMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BoardMember
        fields = '__all__'


class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Board
        fields = '__all__'


class PostSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model  = Post
        fields = '__all__'


class CommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = Comment
        fields = '__all__'


class PollOptionSerializer(serializers.ModelSerializer):
    answers_count = serializers.IntegerField(source='answers.count', read_only=True)

    class Meta:
        model  = PollOption
        fields = '__all__'


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    total_answers = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model  = Poll
        fields = '__all__'

    def get_total_answers(self, obj):
        return obj.answers.count()

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request is None:
            return False
        user_id = request.query_params.get('user_id')
        if not user_id:
            return False
        return obj.answers.filter(user_id=user_id).exists()


class PollAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PollAnswer
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Message
        fields = '__all__'
