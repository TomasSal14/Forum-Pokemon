from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    PROFILE_CHOICES = [
        ('user', 'User'),
        ('mod', 'Mod'),
        ('admin', 'Admin'),
    ]
    STATE_CHOICES = [
        ('active', 'Active'),
        ('banned', 'Banned'),
        ('deleted', 'Deleted'),
    ]

    profile = models.CharField(max_length=20, choices=PROFILE_CHOICES, default='user')
    state   = models.CharField(max_length=20, choices=STATE_CHOICES, default='active')

    def save(self, *args, **kwargs):
        if self.profile == 'mod':
            self.is_staff = True
            self.is_superuser = False
        elif self.profile == 'admin' or self.is_superuser:
            self.profile = 'admin'
            self.is_staff = True
            self.is_superuser = True
        else:
            self.is_staff = False
            self.is_superuser = False
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class Board(models.Model):
    STATE_CHOICES = [
        ('active', 'Active'),
        ('deleted', 'Deleted'),
    ]

    creator       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_boards')
    name          = models.TextField()
    creation_date = models.DateField(auto_now_add=True)
    public        = models.BooleanField(default=True)
    state         = models.CharField(max_length=20, choices=STATE_CHOICES, default='active')

    def __str__(self):
        return self.name


class BoardMember(models.Model):
    board         = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='members')
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='board_memberships')
    creation_date = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('board', 'user')

    def __str__(self):
        return f'{self.user} in {self.board}'


class Post(models.Model):
    STATE_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('deleted', 'Deleted'),
    ]

    creator       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    board         = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='posts')
    content       = models.TextField()
    state         = models.CharField(max_length=20, choices=STATE_CHOICES, default='active')
    creation_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'Post by {self.creator} in {self.board}'


class Comment(models.Model):
    STATE_CHOICES = [
        ('active', 'Active'),
        ('deleted', 'Deleted'),
    ]

    user           = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='comments')
    post           = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    board          = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='comments')
    content        = models.TextField()
    parent_comment = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    state          = models.CharField(max_length=20, choices=STATE_CHOICES, default='active')
    creation_date  = models.DateField(auto_now_add=True)

    def __str__(self):
        author = self.user.username if self.user_id else 'Anonymous'
        return f'Comment by {author} on {self.post}'


class Poll(models.Model):
    STATE_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('deleted', 'Deleted'),
    ]

    creator       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='polls')
    name          = models.TextField()
    state         = models.CharField(max_length=20, choices=STATE_CHOICES, default='open')
    creation_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name


class PollOption(models.Model):
    poll          = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='options')
    label         = models.CharField(max_length=255)
    creation_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'{self.label} ({self.poll})'


class PollAnswer(models.Model):
    poll          = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='answers')
    poll_option   = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name='answers')
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poll_answers')
    creation_date = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('poll', 'user')

    def __str__(self):
        return f'{self.user} voted {self.poll_option} in {self.poll}'


class Message(models.Model):
    STATE_CHOICES = [
        ('active', 'Active'),
        ('deleted', 'Deleted'),
    ]

    user_sent_it  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    user_receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content       = models.TextField()
    state         = models.CharField(max_length=20, choices=STATE_CHOICES, default='active')
    creation_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'Message from {self.user_sent_it} to {self.user_receiver}'
