from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^login/$', 'django.contrib.auth.views.login'),
    (r'^logout/$', 'django.contrib.auth.views.logout_then_login'),
    (r'^password_change/$', 'django.contrib.auth.views.password_change'),
    (r'^password_change_done/$', 'django.contrib.auth.views.password_change_done'),
    (r'^signup/$', 'reggae.usermanagement.views.user_creation'),
    (r'^signup_done/$', 'reggae.usermanagement.views.user_creation_done'),
    (r'^player_profile/$', 'reggae.usermanagement.views.player_profile_creation'),
    # TODO : profile
)
