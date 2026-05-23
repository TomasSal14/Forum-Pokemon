from django.urls import path
from . import views

urlpatterns = [
    path('users/<int:pk>/',          views.user_detail,   name='user-detail'),

    path('boards/',                  views.boards_list,   name='boards-list'),
    path('boards/<int:pk>/',         views.board_detail,  name='board-detail'),
    path('boards/<int:pk>/posts/',   views.board_posts,   name='board-posts'),

    path('posts/',                   views.posts_list,    name='posts-list'),
    path('posts/<int:pk>/',          views.post_detail,   name='post-detail'),
    path('posts/<int:pk>/comments/', views.post_comments, name='post-comments'),

    path('polls/',                   views.polls_list,    name='polls-list'),
    path('polls/<int:pk>/',          views.poll_detail,   name='poll-detail'),
    path('polls/<int:pk>/vote/',     views.poll_vote,     name='poll-vote'),

    path('messages/',                views.messages_list,   name='messages-list'),
    path('messages/<int:pk>/',       views.message_detail,  name='message-detail'),

    path('auth/register/',           views.register,      name='auth-register'),
    path('auth/login/',              views.login,         name='auth-login')
]
