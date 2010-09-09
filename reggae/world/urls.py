from django.conf.urls.defaults import *

urlpatterns = patterns('reggae.world.views',
    (r'^rect/(?P<x1>\d+)/(?P<y1>\d+)/(?P<x2>\d+)/(?P<y2>\d+)/$', 'get_world_rect'),
    (r'^editor/$', 'editor'),
)
