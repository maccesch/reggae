from django import template
from django.utils.safestring import mark_safe
from django.conf import settings

register = template.Library()

def do_reggae_scripts(parser, token):
    return ReggaeScriptsNode()

class ReggaeScriptsNode(template.Node):
    
    exported_settings = (
        'MEDIA_URL',
        'IMAGES_ROOT',
        'SKINS_ROOT',
        'SKIN',
    )
    
    def serialize_settings(self):
        js = '<script type="text/javascript">var settings = { '
        for setting in self.exported_settings:
            js += setting + ': "' + getattr(settings, setting) + '",'
            
        js = js[:-1] + ' }</script>'
        return js
    
    
    def render(self, context):
        return mark_safe(self.serialize_settings() + '''
            <script type="text/javascript" src="%(url)sscripts/package.js"></script>
            <script type="text/javascript" src="%(url)sscripts/application/Main.js"></script>
        ''' % { 'url': settings.MEDIA_URL })
        
register.tag('reggae_scripts', do_reggae_scripts)