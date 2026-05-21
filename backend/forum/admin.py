from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db.models import Count

from .models import User, Board, BoardMember, Post, Comment, Poll, PollOption, PollAnswer, Message

# Desativar a acao de delete padrao em todos os modelos
admin.site.disable_action('delete_selected')


# ---------------------------------------------------------------------------
# Acoes reutilizaveis de soft delete
# ---------------------------------------------------------------------------

def soft_delete(modeladmin, request, queryset):
    queryset.update(state='deleted')
soft_delete.short_description = 'Soft delete selecionados'


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

def ban_users(modeladmin, request, queryset):
    queryset.update(state='banned', is_active=False)
ban_users.short_description = 'Banir utilizadores selecionados'

def reactivate_users(modeladmin, request, queryset):
    queryset.update(state='active', is_active=True)
reactivate_users.short_description = 'Reativar utilizadores selecionados'

def soft_delete_users(modeladmin, request, queryset):
    queryset.update(state='deleted', is_active=False)
soft_delete_users.short_description = 'Soft delete utilizadores selecionados'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    actions = [ban_users, reactivate_users, soft_delete_users]

    list_display  = ('username', 'email', 'state', 'date_joined', 'is_staff')
    list_filter   = ('state', 'is_staff')
    search_fields = ('username', 'email')

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Perfil', {'fields': ('profile', 'state')}),
    )


# ---------------------------------------------------------------------------
# Board
# ---------------------------------------------------------------------------


class PostInline(admin.TabularInline):
    model  = Post
    extra  = 0
    fields = ('creator', 'content', 'state', 'creation_date')
    readonly_fields = ('creation_date',)


def soft_delete_boards(modeladmin, request, queryset):
    queryset.update(state='deleted')
soft_delete_boards.short_description = 'Soft delete boards selecionados'


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    actions = [soft_delete_boards]
    inlines = [PostInline]

    list_display  = ('name', 'creator', 'public', 'state', 'member_count', 'post_count', 'creation_date')
    list_filter   = ('public', 'state')
    search_fields = ('name', 'creator__username')

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _member_count=Count('members', distinct=True),
            _post_count=Count('posts', distinct=True),
        )

    @admin.display(description='Membros', ordering='_member_count')
    def member_count(self, obj):
        return obj._member_count

    @admin.display(description='Posts', ordering='_post_count')
    def post_count(self, obj):
        return obj._post_count


# ---------------------------------------------------------------------------
# Post
# ---------------------------------------------------------------------------

class CommentInline(admin.TabularInline):
    model  = Comment
    extra  = 0
    fields = ('user', 'content', 'state', 'creation_date')
    readonly_fields = ('creation_date',)


def close_posts(modeladmin, request, queryset):
    queryset.update(state='closed')
close_posts.short_description = 'Fechar posts selecionados'

def reopen_posts(modeladmin, request, queryset):
    queryset.update(state='active')
reopen_posts.short_description = 'Reabrir posts selecionados'

def soft_delete_posts(modeladmin, request, queryset):
    queryset.update(state='deleted')
soft_delete_posts.short_description = 'Soft delete posts selecionados'


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    actions = [close_posts, reopen_posts, soft_delete_posts]
    inlines = [CommentInline]

    list_display   = ('content_preview', 'creator', 'board', 'state', 'creation_date')
    list_filter    = ('board', 'state', 'creation_date')
    search_fields  = ('content', 'creator__username')
    date_hierarchy = 'creation_date'

    @admin.display(description='Conteúdo')
    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------

def soft_delete_comments(modeladmin, request, queryset):
    queryset.update(state='deleted')
soft_delete_comments.short_description = 'Soft delete comentários selecionados'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    actions = [soft_delete_comments]

    list_display   = ('user', 'board', 'post', 'content_preview', 'state', 'creation_date')
    list_filter    = ('board', 'state', 'creation_date')
    search_fields  = ('content', 'user__username')
    raw_id_fields  = ('post', 'parent_comment')

    @admin.display(description='Conteúdo')
    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content


# ---------------------------------------------------------------------------
# Poll
# ---------------------------------------------------------------------------

class PollOptionInline(admin.TabularInline):
    model  = PollOption
    extra  = 2
    fields = ('label', 'creation_date')
    readonly_fields = ('creation_date',)


def close_polls(modeladmin, request, queryset):
    queryset.update(state='closed')
close_polls.short_description = 'Fechar polls selecionadas'

def soft_delete_polls(modeladmin, request, queryset):
    queryset.update(state='deleted')
soft_delete_polls.short_description = 'Soft delete polls selecionadas'


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    actions = [close_polls, soft_delete_polls]
    inlines = [PollOptionInline]

    list_display  = ('name', 'creator', 'state', 'option_count', 'answer_count', 'creation_date')
    list_filter   = ('state',)
    search_fields = ('name', 'creator__username')

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _option_count=Count('options', distinct=True),
            _answer_count=Count('answers', distinct=True),
        )

    @admin.display(description='Opções', ordering='_option_count')
    def option_count(self, obj):
        return obj._option_count

    @admin.display(description='Respostas', ordering='_answer_count')
    def answer_count(self, obj):
        return obj._answer_count


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------

def soft_delete_messages(modeladmin, request, queryset):
    queryset.update(state='deleted')
soft_delete_messages.short_description = 'Soft delete mensagens selecionadas'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    actions = [soft_delete_messages]

    list_display  = ('user_sent_it', 'user_receiver', 'content_preview', 'state', 'creation_date')
    list_filter   = ('state', 'creation_date')
    search_fields = ('user_sent_it__username', 'user_receiver__username')

    @admin.display(description='Conteúdo')
    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
