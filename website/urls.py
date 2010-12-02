from django.conf.urls.defaults import patterns, include

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

    (r'^admin/', include(admin.site.urls)),
)
