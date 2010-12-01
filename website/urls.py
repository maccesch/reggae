from django.conf.urls.defaults import *

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^website/', include('website.foo.urls')),

    (r'^admin/', include(admin.site.urls)),
)
