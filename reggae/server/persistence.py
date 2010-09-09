from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.auth.middleware import AuthenticationMiddleware
from django.conf import settings

from reggae.gameobjectpersistence.models import *
from reggae.controls.models import *
from reggae.usermanagement.models import *
from reggae.world.models import *

from random import random


class PseudoRequest():
	"""
	Psuedo http request class used to use django middlewares to determine
	logged in users.
	"""
	COOKIES = {}


def get_user_for_session_id(session_id):
	"""Returns a django user object for a given session id."""
	req = PseudoRequest()
	req.COOKIES[settings.SESSION_COOKIE_NAME] = session_id
	
	get_user_for_session_id.session_mw.process_request(req)
	get_user_for_session_id.auth_mw.process_request(req)
	
	return req.user

get_user_for_session_id.session_mw = SessionMiddleware()
get_user_for_session_id.auth_mw = AuthenticationMiddleware()


def _create_model_elements_for_new_user(user):
	"""Creates all model elements and views for a new user. GAME_CODE"""
	created_models = []
	
	mp = MovingPoint(vx=0, vy=0, vz=0)
	mp.x=random()*700 + 21 * 64
	mp.y=random()*500 + 21 * 64
	mp.z=0
	mp.owner=user
	mp.persistence=False
	mp.element_id=1
	mp.save()

	wv = WorldView(centerX=mp.x, centerY=mp.y, centerZ=mp.z, follow_model=mp, owner=user)
	wv.save()
	
	# TODO : active profile (multiple)?
	profile = PlayerProfile.objects.filter(user__exact=user)[0]
	
	av = AvatarView(model=mp, player_profile=profile, bias_left=32, bias_top=64)
	av.save()
	
	vd = ViewPlayerNameDecoration(model=mp, player_profile=profile)
	vd.save()
	
	
def _create_controls_for_new_user(user):
	"""Creates all default controls for a new user. GAME_CODE"""
	Control(owner=user, input="a", action_id="left", description="Move to the left").save()
	Control(owner=user, input="d", action_id="right", description="Move to the right").save()
	Control(owner=user, input="w", action_id="top", description="Move to the top").save()
	Control(owner=user, input="s", action_id="bottom", description="Move to the bottom").save()
	Control(owner=user, input="c", action_id="chat", description="Start chat").save()
	
	
def _is_first_login(user):
	"""Returns True if the user has logged in for the first time"""
	return MovingPoint.objects.filter(owner__exact=user).count() == 0


def check_first_login(user):
	"""
	If the user has logged for the first time, inital model elements are created and returned in a list.
	An empty list is returned if the user isn't a first time login.
	"""
	if _is_first_login(user):
		_create_controls_for_new_user(user)
		_create_model_elements_for_new_user(user)


def get_views_for_model(model):
	"""Returns all view and decoration objects of the given model element or (client_id, element_id) tuple"""
	
	views = []
	if hasattr(model, 'simpleimageview'):
		views.append(model.simpleimageview)
	elif hasattr(model, 'avatarview'):
		views.append(model.avatarview)
	elif hasattr(model, 'simpleimagebuildingview'):
		views.append(model.simpleimagebuildingview)
		
	views.extend(model.viewplayernamedecoration_set.all())
	
	return views
