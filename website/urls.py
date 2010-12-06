from django.conf.urls.defaults import patterns, include
from django.conf import settings

from django.contrib import admin
admin.autodiscover()

from zinnia.sitemaps import EntrySitemap
# from zinnia.sitemaps import CategorySitemap

urlpatterns = patterns('',

    (r'^sitemap.xml$', 'django.contrib.sitemaps.views.sitemap', { 'sitemaps': {
        'blog': EntrySitemap,
#        'categories': CategorySitemap,
    }}),

    (r'^blog/', include('zinnia.urls')),
    (r'^comments/', include('django.contrib.comments.urls')),
    
    (r'^docs/', 'django.views.generic.simple.redirect_to', { 'url': 'https://github.com/maccesch/reggae/wiki' }),
    (r'^code/', 'django.views.generic.simple.redirect_to', { 'url': 'https://github.com/maccesch/reggae' }),
    (r'^download/', 'django.views.generic.simple.redirect_to', { 'url': 'https://github.com/maccesch/reggae/archives/master' }),

    (r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT, 'show_indexes': True})
    )
