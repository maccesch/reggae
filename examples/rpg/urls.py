from django.conf.urls.defaults import *

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    (r'^world/', include('reggae.world.urls')),
    (r'^accounts/', include('usermanagement.urls')),

    (r'^admin/', include(admin.site.urls)),
    
    (r'^$', 'gamemain.views.main'),
)
