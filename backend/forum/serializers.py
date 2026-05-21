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
    class Meta:
        model  = Post
        fields = '__all__'


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Comment
        fields = '__all__'


class PollOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PollOption
        fields = '__all__'


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)

    class Meta:
        model  = Poll
        fields = '__all__'


class PollAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PollAnswer
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Message
        fields = '__all__'
