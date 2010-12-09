from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.auth.middleware import AuthenticationMiddleware
from django.conf import settings
from django.contrib.auth.models import User

from django.utils.importlib import import_module


class PseudoRequest():
	"""
	Psuedo http request class used to use django middlewares to determine
	logged in users.
	"""
	COOKIES = {}


class UsermanagementNotAvailable(Exception):
	pass


def get_user_for_session_id(session_id):
	"""Returns a django user object for a given session id."""
	req = PseudoRequest()
	req.COOKIES[settings.SESSION_COOKIE_NAME] = session_id
	
	get_user_for_session_id.session_mw.process_request(req)
	get_user_for_session_id.auth_mw.process_request(req)
	
	if req.user.is_anonymous() and settings.ALLOW_ANONYMOUS_USERS:
		return _create_anon_user()
	else:
		return req.user

get_user_for_session_id.session_mw = SessionMiddleware()
get_user_for_session_id.auth_mw = AuthenticationMiddleware()


def _create_anon_user():
	_create_anon_user.anonymous_user_no += 1
	
	username = 'guest' + str(_create_anon_user.anonymous_user_no)
	user = User.objects.filter(username__exact=username)
	if len(user) > 0:
		user = user[0]
	else:
		user = User(username=username)
		user.set_unusable_password()
		user.save();
		get_user_manager().create_default_user_profile(user)
	
	return user

_create_anon_user.anonymous_user_no = 0


def get_user_manager():
	if not get_user_manager.manager_cache:
		if not getattr(settings, 'USERMANAGER_MODULE', False):
			raise UsermanagementNotAvailable('You need to set USERMANAGER_MO'
										  'DULE in your project settings')
		try:
			app_label, class_name = settings.USERMANAGER_MODULE.split('.')
		except ValueError:
			raise UsermanagementNotAvailable('app_label and class_name should'
					' be separated by a dot in the USERMANAGER_MODULE set'
					'ting')

		try:
#			app_module = import_module(app_label)
			usermanagement = import_module('.usermanagement', app_label)
			usermanagement_class = getattr(usermanagement, class_name)
			get_user_manager.manager_cache = usermanagement_class()
			
		except (ImportError, AttributeError):
			raise UsermanagementNotAvailable('Unable to load the usermanagement '
				'class, check USERMANAGER_MODULE in your project sett'
				'ings')
			
	return get_user_manager.manager_cache

get_user_manager.manager_cache = None


# TODO : create view registry and check if for all possible views instead of hard coding it here
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
