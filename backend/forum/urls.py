from django.urls import path
from . import views

urlpatterns = [
    path('users/',                    views.users_list,      name='users-list'),
    path('users/<int:pk>/',           views.user_detail,     name='user-detail'),
    path('users/<int:pk>/content/',   views.user_content,    name='user-content'),
    path('users/<int:pk>/ban/',       views.user_ban,        name='user-ban'),
    path('users/admin/list/',         views.users_admin_list, name='users-admin-list'),

    path('boards/',                   views.boards_list,     name='boards-list'),
    path('boards/<int:pk>/',         views.board_detail,  name='board-detail'),
    path('boards/<int:pk>/posts/',   views.board_posts,   name='board-posts'),
    path('boards/<int:pk>/members/', views.board_members, name='board-members'),

    path('posts/',                   views.posts_list,    name='posts-list'),
    path('posts/<int:pk>/',          views.post_detail,   name='post-detail'),
    path('posts/<int:pk>/comments/', views.post_comments, name='post-comments'),
    path('comments/<int:pk>/',       views.comment_detail, name='comment-detail'),

    path('polls/',                   views.polls_list,    name='polls-list'),
    path('polls/<int:pk>/',          views.poll_detail,   name='poll-detail'),
    path('polls/<int:pk>/vote/',     views.poll_vote,     name='poll-vote'),
    path('polls/<int:pk>/close/',    views.poll_close,    name='poll-close'),

    path('messages/',                views.messages_list,   name='messages-list'),
    path('messages/<int:pk>/',       views.message_detail,  name='message-detail'),

    path('auth/register/',           views.register,      name='auth-register'),
    path('auth/login/',              views.login,         name='auth-login')
]
