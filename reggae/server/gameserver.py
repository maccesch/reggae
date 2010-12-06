from __future__ import with_statement

from twisted.internet.protocol import Protocol, ServerFactory
from twisted.internet import reactor

import django.core.handlers.wsgi

import sys, urllib, string
from os.path import dirname, join
from cStringIO import StringIO
from wsgiref.handlers import BaseHandler

import persistence
from grid import Grid
from simulation import Simulator

from django.contrib.admin import __file__ as __django_admin_file__
from django.conf import settings

from reggae.gameobjectpersistence.models import Point
from reggae.world.models import World
from reggae import __file__ as __reggae_file__

REGGAE_MEDIA_ROOT = join(dirname(__reggae_file__), 'media')
DJANGO_ADMIN_PATH = dirname(__django_admin_file__)

SERVER_PORT = getattr(settings, 'SERVER_PORT', 8090)


class RealtimeHttpProtocol(Protocol):
	
	def __init__(self):
		self.server = "Macceschs Twisted RHTTP/alpha4"
		self.waiting_for_data = False;
	
	def write_response_start(self, content_type, status="200 OK"):
		self.write_line("HTTP/1.1 " + status)
		self.write_line("Server:" + self.server)
		self.write_line("Content-Type:" + content_type)
		self.write_line()

	def write_file(self, content_type):
		"""Writes the contents of the requested (self.path) file."""
		
		# TODO : write 404 File not found if that is the case
		try:
			with open(settings.MEDIA_ROOT + self.path, "rb") as f:
				self.write_response_start(content_type)
				self.transport.write(f.read())
		except IOError:
			try:
				with open(REGGAE_MEDIA_ROOT + self.path, "rb") as f:
					self.write_response_start(content_type)
					self.transport.write(f.read())
			except IOError:
				try:
					with open(DJANGO_ADMIN_PATH + self.path, "rb") as f:
						self.write_response_start(content_type)
						self.transport.write(f.read())
				except IOError:
					self.write_response_start('text/plain', '404 Not Found')
			
			
		self.transport.loseConnection()
	
	def connectionMade(self):
		"""Called when a client connection is made. See twisted Protocol docs."""
		pass
#		 print "connection made from", str(self.transport.getPeer())

	def connectionLost(self, reason):
		"""Called when a client connection is lost or closed. See twisted Protocol docs."""

		# TODO : write last known state of client to db
		if hasattr(self, 'client_id'):
			interested_clients, removed_points = self.factory.grid.remove_client_and_points(self)
			self.factory.simulator.remove_points(removed_points)
			del self.factory.session_id_to_client[self.session_id]
			
			for c in interested_clients:
				c.write_line("dis")
				c.write_line(str(self.client_id))
					

	def parse_url(self, data):
		"""Builds the strings self.method, self.path, self.query"""
		
		first_line = data.split("\n", 1)[0].strip()
		self.method, url, self.protocol = first_line.split(" ")
		self.method = self.method.upper()
		if '?' in url:
			self.path, self.query = url.split('?', 1)
		else:
			self.path, self.query = url, ''
	
	def parse_headers(self, data):
		"""Builds the self.headers dictionary and the string self.data"""
		
		headers = {}
		headerLines = data.splitlines()[1:]
		i = 0
		for line in headerLines:
			i += 1
			if line == "":
				break
			key, value = line.split(":", 1)
			headers[key.lower()] = value.strip()
		
		self.headers = headers
		self.data = string.join(headerLines[i:], "\r\n").strip()
	
	def check_request(self, data):
		"""Checks validity of the sent data and handles partial requests"""
		
		if not data.startswith("POST") and not data.startswith("GET") and not data.startswith("HEAD") and not self.waiting_for_data:
			return False

		if not self.waiting_for_data:
			self.parse_url(data)
			self.parse_headers(data)
			
			if (self.method == "POST" and self.data == ""):
				self.waiting_for_data = True
				self.write_line("HTTP/1.1 100 Continue")
				self.write_line("Server:" + self.server)
				return False
		else:
			self.data = data
			self.waiting_for_data = False
			
		return True
	
	def dataReceived(self, data):
		"""Called when client has sent data. See twisted Protocol docs."""
		
#		 print "data received: ----------------------------"
#		 print data
		
		if not self.check_request(data):
			return
		
		# TODO : handle file not found!
		
		if self.path.startswith("/_"):
			self.handle_realtime_request()
			
		elif self.path.endswith(".html"):
			self.write_file("text/html")
		elif self.path.endswith(".css"):
			self.write_file("text/css")
		elif self.path.endswith('.js'):
			self.write_file("text/javascript")
		elif self.path.endswith('.jpg'):
			self.write_file("image/jpg")
		elif self.path.endswith('.png'):
			self.write_file("image/png")
		elif self.path.endswith('.gif'):
			self.write_file("image/gif")
		elif self.path.endswith('.ico'):
			self.write_file("image/vnd.microsoft.icon")
		else:
			# send request to django
			django_app = django.core.handlers.wsgi.WSGIHandler()
	
			handler = ProtocolWsgiHandler(self)
			handler.run(django_app)
			
			self.transport.loseConnection()


	def handle_realtime_request(self):
		"""
		Handles the realtime http stuff. Takes care of the correct message distribution.
		For details of the protocol see WebContent/scripts/Network.js and .../ModelFacade.js
		"""
		
		# TODO : put this to the top => performance increase for time critical data
		data_str = self.path[2:]
		data_array = string.split(data_str, "_")
		
		op_code = data_array[0]
		self.session_id = data_array[-1]
		
		# TODO : change this in some kind of attrib lookup
		if op_code == "id":
			self._handle_new_realtime_client()
			# don't lose connection
		else:
			# send an ok answer so nobody tries to send again
			self.write_response_start("text/plain")
			
			# don't answer directly to this connection but through the stored push connection
			self.transport.loseConnection()

			client = self.factory.session_id_to_client[self.session_id]
			data_array[-1] = str(client.client_id)

			if op_code == 'cv':
				self._handle_change_velocity(data_array, client)
				
			elif op_code == 'msg':
				self._handle_message(data_array, client)
			

	def _handle_message(self, data_array, client):
		"""Handle a realtime message request from client"""
		element_id = int(data_array[1]);
		element = self.factory.simulator.get_element(element_id);
		response_data = "\n".join(data_array)
		clients = self.factory.grid.get_clients(element.x, element.y)
		for c in clients:
			if c != client:
				c.write_line(response_data)

	
	def _handle_change_velocity(self, data_array, client):
		"""Handle a realtime change velocity request from client"""

		client_id = client.client_id
		
		response_data = "\n".join(data_array)

		element_id = int(data_array[1])
		x = float(data_array[2])
		y = float(data_array[3])
		z = float(data_array[4])
		vx = float(data_array[5])
		vy = float(data_array[6])
		vz = float(data_array[7])
		
		moving_point = self.factory.simulator.change_moving_point(element_id, x, y, z, vx, vy, vz)
		
		interested_clients, former_clients, new_points, old_points = self.factory.grid.change_point(moving_point, client)

		for c in interested_clients.intersection(former_clients):
			if c.client_id != client_id:
				c.write_line(response_data)
		
		new_clients = interested_clients.difference(former_clients)
		if new_clients:
			new_str = moving_point.to_realtime_http() + '\n'
			for view in persistence.get_views_for_model(moving_point):
				new_str += view.to_realtime_http() + '\n'
				
			new_str = new_str[0:-1]
			for c in new_clients:
				if c.client_id != client_id:
					c.write_line(new_str)
				
		del_str = 'del\n' + str(element_id) + '\n' + str(client_id)
		for c in former_clients.difference(interested_clients):
			c.write_line(del_str)
		
		for point in new_points:
			client.write_line(point.to_realtime_http())
			for view in persistence.get_views_for_model(point):
				client.write_line(view.to_realtime_http())
			
		for point in old_points:
			client.write_line('del\n' + str(point.id) + '\n' + str(point.owner.id))
		
	
	def _handle_new_realtime_client(self):
		# TODO : self.user ?
		# TODO : handle multiple logins with same user
		user = persistence.get_user_for_session_id(self.session_id)
		
		if user.is_anonymous():
			# user isn't logged in => tell client to log in
			self.write_line("li")
			self.transport.loseConnection()
			
		else:
			self.client_id = user.id
			# TODO : multiple player profiles?
			self.client_name = persistence.get_profile_for_user(user)
			
			self.write_response_start("text/plain")
			self.write_line("id")
			self.write_line(str(self.client_name))
			self.write_line(str(self.client_id))

			# tell the new guy all game state and the others about the new guy
			self._write_model_elements_for_user(user)
			self._write_controls_for_user(user)
	
			self.factory.session_id_to_client[self.session_id] = self
		
		
	def _write_model_elements_for_user(self, user):
		"""
		Fetches the model elements and their views for the given user from the 
		database and sends them to everybody interested.
		Sends the user all model elements and their view and additional stuff
		that he needs to know.
		"""
		
		grid = self.factory.grid
		simulator = self.factory.simulator

		# create models and stuff for first time users
		persistence.check_first_login(user)
		
		# first send everyone interested the models and views that are only visible when the user is logged in
		# while at it collect all points that the new client wants to know about
		self_points = set()
		for point in user.point_set.exclude(persistent__exact=True):
			try:
				point = point.movingpoint
				simulator.add_moving_point(point)
			except:
				pass
			
			model_str = ""
			# TODO : not moving points don't belong in the grid??
			interested_clients, _, _, _ = grid.change_point(point, self)
			
			model_str += point.to_realtime_http() + "\n"
				
			for view in persistence.get_views_for_model(point):
				model_str += view.to_realtime_http() + "\n"
				
			for c in interested_clients:
				if c != self:
					c.transport.write(model_str)
			
			# do the collecting	   
			self_points.update(grid.get_points(point.x, point.y))

		# second send the user all stuff he needs to know
			
		# TODO : multiple world views???
		world_view = user.worldview_set.all()[0]
		self_model_str = world_view.to_realtime_http() + '\n'
		
		for point in self_points:
			self_model_str += point.to_realtime_http() + "\n"

			for view in persistence.get_views_for_model(point):
				self_model_str += view.to_realtime_http() + "\n"
		
		self_model_str += world_view.follow_to_realtime_http() + '\n'
		
		self.transport.write(self_model_str)
		

	def _write_controls_for_user(self, user):
		ctrlStr = ""
		for ctrl in user.control_set.all():
			ctrlStr += ctrl.to_realtime_http() + "\n"
			
		self.transport.write(ctrlStr[0:-1])


	def write_line(self, message=""):
		"""Sends a text line to the client"""
		
		self.transport.write(message + '\n')
		

class ProtocolWsgiHandler(BaseHandler):
	"""WSGI handler class for a twisted protocol object that has the string fields data, method, path, headers, query"""
	
	def __init__(self, protocol):
		self.stdin = StringIO(protocol.data)
		self.protocol = protocol
		
		self.build_env()

	def build_env(self):
		self.env = {}
		self.env['REQUEST_METHOD'] = self.protocol.method
		self.env['PATH_INFO'] = urllib.unquote(self.protocol.path)
		self.env['SERVER_PROTOCOL'] = self.protocol.protocol
		self.env['QUERY_STRING'] = self.protocol.query
		self.env['SERVER_NAME'] = self.protocol.headers["host"]
		self.env['SERVER_PORT'] = '8000'
		self.env['REMOTE_HOST'] = ''
		self.env['SCRIPT_NAME'] = ''
		
		if "content-type" in self.protocol.headers:
			self.env["CONTENT_TYPE"] = self.protocol.headers["content-type"]
		if "content-length" in self.protocol.headers:
			self.env["CONTENT_LENGTH"] = self.protocol.headers["content-length"]

		for header_key in self.protocol.headers:
			key = header_key.replace('-', '_').upper()
			value = self.protocol.headers[header_key]
			if key in self.env:
				continue							  # skip content length, type,etc.
			if 'HTTP_' + key in self.env:
				self.env['HTTP_' + key] += ',' + value	   # comma-separate multiple headers
			else:
				self.env['HTTP_' + key] = value
		
#		 print self.env

	def _write(self, data):
#		 print data 
		self.protocol.transport.write(data);
		self._write = self.protocol.transport.write
		
	def _flush(self):
		pass
	
	def get_stdin(self):
		return self.stdin
	
	def get_stderr(self):
		return sys.stderr
	
	def add_cgi_vars(self):
		self.environ.update(self.env)


factory = ServerFactory()
factory.protocol = RealtimeHttpProtocol

# TODO : current world?
world = World.objects.get(pk=1)
world_size = max(world.get_width(), world.get_height())

factory.grid = Grid(world_size)
factory.simulator = Simulator()
factory.session_id_to_client = {}

# add all persistent model elements
for point in Point.objects.filter(persistent__exact=True):
	el = point
	if hasattr(point, 'movingpoint'):
		el = point.movingpoint
	elif hasattr(point, 'wall'):
		el = point.wall
	
	# TODO : add to simulation
	
	factory.grid.change_point(el, None)


# profile if this file is executed directly
if __name__ == '__main__':
	import cProfile
	
	reactor.listenTCP(SERVER_PORT, factory)
	cProfile.run('reactor.run()', 'rhttp_profile.log')
	print "byebye"
