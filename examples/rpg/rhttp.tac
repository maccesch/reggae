###########################################################
#														  #
# Use this to start the server:							  # 
#														  #
#	  twistd -y rhttp.tac								  #
#														  #
# or for debugging:										  # 
#														  #
#	  twistd -ny rhttp.tac								  #
#														  #
###########################################################


from os.path import abspath, dirname, join, normpath, split
import os, sys

from twisted.application import internet, service

from django.core.management import setup_environ

# set this to the location of your Django app (the folder where settings.py is in)
DJANGO_PROJECT_PATH = abspath(dirname(__file__))

# setup django environment
_, DJANGO_PROJECT_NAME = split(DJANGO_PROJECT_PATH)

sys.path.append(normpath(join(DJANGO_PROJECT_PATH, '..')))

name = DJANGO_PROJECT_NAME + '.settings'
__import__(name)
settings_mod = sys.modules[name]
setup_environ(settings_mod)

# start server
from reggae.server import gameserver

application = service.Application("rhttpd")

rhttp_service = internet.TCPServer(gameserver.SERVER_PORT, gameserver.factory)
rhttp_service.setServiceParent(application)