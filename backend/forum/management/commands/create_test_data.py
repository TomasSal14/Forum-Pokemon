from django.core.management.base import BaseCommand
from forum.models import User, Board, BoardMember, Post, Comment, Poll, PollOption, PollAnswer, Message


class Command(BaseCommand):
    help = 'Cria dados de teste'

    def handle(self, *args, **kwargs):

        # Users
        admin = User.objects.create_user(username='ash', password='1234', profile='admin')
        mod   = User.objects.create_user(username='misty', password='1234', profile='mod')
        user1 = User.objects.create_user(username='brock', password='1234', profile='user')
        user2 = User.objects.create_user(username='gary', password='1234', profile='user')
        self.stdout.write('Users criados')

        # Boards
        board1 = Board.objects.create(creator=admin, name='Pokémon Competitivo', public=True)
        board2 = Board.objects.create(creator=mod,   name='Trocas', public=True)
        board3 = Board.objects.create(creator=admin, name='Staff', public=False)
        self.stdout.write('Boards criados')

        # Board Members
        BoardMember.objects.create(board=board1, user=user1)
        BoardMember.objects.create(board=board1, user=user2)
        BoardMember.objects.create(board=board2, user=user1)
        self.stdout.write('BoardMembers criados')

        # Posts
        post1 = Post.objects.create(creator=user1, board=board1, content='Qual o melhor Pokémon para competitivo?')
        post2 = Post.objects.create(creator=user2, board=board1, content='Dicas para treinar Charizard?', state='closed')
        post3 = Post.objects.create(creator=mod,   board=board2, content='Troco Gengar por Alakazam')
        self.stdout.write('Posts criados')

        # Comments
        c1 = Comment.objects.create(user=user2, post=post1, board=board1, content='Garchomp é imbatível!')
        c2 = Comment.objects.create(user=mod,   post=post1, board=board1, content='Discordo, Mewtwo é melhor.')
        Comment.objects.create(user=user1, post=post1, board=board1, content='Concordo com o Garchomp!', parent_comment=c1)
        Comment.objects.create(user=user1, post=post3, board=board2, content='Tenho Alakazam, manda mensagem!')
        self.stdout.write('Comments criados')

        # Polls
        poll1 = Poll.objects.create(creator=admin, name='Qual o starter favorito de Kanto?')
        op1 = PollOption.objects.create(poll=poll1, label='Charmander')
        op2 = PollOption.objects.create(poll=poll1, label='Bulbasaur')
        op3 = PollOption.objects.create(poll=poll1, label='Squirtle')
        PollAnswer.objects.create(poll=poll1, poll_option=op1, user=user1)
        PollAnswer.objects.create(poll=poll1, poll_option=op2, user=user2)
        PollAnswer.objects.create(poll=poll1, poll_option=op1, user=mod)

        poll2 = Poll.objects.create(creator=mod, name='Geração favorita?', state='closed')
        PollOption.objects.create(poll=poll2, label='Geração 1')
        PollOption.objects.create(poll=poll2, label='Geração 2')
        self.stdout.write('Polls criadas')

        # Messages
        Message.objects.create(user_sent_it=user1, user_receiver=user2, content='Olá Gary, queres trocar Pokémon?')
        Message.objects.create(user_sent_it=user2, user_receiver=user1, content='Claro, que Pokémon tens?', state='read')
        Message.objects.create(user_sent_it=admin, user_receiver=mod,   content='Podes moderar o board de trocas?')
        self.stdout.write('Messages criadas')

        self.stdout.write(self.style.SUCCESS('Dados de teste criados com sucesso!'))
