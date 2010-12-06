from django.forms.widgets import Widget
from django.utils.encoding import force_unicode
from django.utils.safestring import mark_safe
from django.forms.util import flatatt
from django.conf import settings
from models import Avatar

class AvatarSelect(Widget):
    """An widget that shows one of a list of possible avatars and lets the user browse through them."""
    
    def __init__(self, attrs=None, avatars=[], width=64, height=64):
        """avatars is the list of Avatar objects (see models) to each avatar, width and height are the dimensions in pixels of the widget"""
        super(AvatarSelect, self).__init__(attrs)

        # TODO : put this in a field?
        if len(avatars) == 0:
            avatars = Avatar.objects.order_by('id')
        self.avatars = list(avatars)
        self.width = width
        self.height = height
        
    def render(self, name, value, attrs=None):
        if value is None: value = 1
        
        inner_name = name + "_inner_select"
        input_name = name + "_avatar_input"
        button_left_name = name + "_button_left"
        button_right_name = name + "_button_right"
        
        final_attrs = self.build_attrs(attrs)
        output = [u'<input id="' + input_name + '" type="hidden" name="' + name + '" value="' + unicode(value) + '"></input>',
                  u'<div style="line-height: ' + unicode(self.height) + 'px; height: ' + \
                    unicode(self.height) + 'px;"%s>' % flatatt(final_attrs),
                  self._render_left_button(button_left_name),
                  u'<div style="display: inline-block; width: ' + unicode(self.width) + 'px; height: ' + unicode(self.height) + 'px">',
                  u'<div style="overflow: hidden; width: ' + unicode(self.width) + 'px; height: ' + \
                    unicode(self.height) + 'px; position: absolute; background: #ccc;">',
                  u'<div id="' + inner_name + '" style="width: ' + unicode(len(self.avatars)*self.width) + \
                    'px; position: absolute; left: ' + unicode(-self.width * (value-1)) + 'px; top: 0px;">']
        
        options = self._render_options()
        if options:
            output.append(options)
        output.append(u'</div>\n</div>\n</div>')
        
        output.append(self._render_right_button(button_right_name))
        output.append(u'</div>')
        
        output.append(self._render_scripts(inner_name, button_left_name, button_right_name, input_name))
        
        return mark_safe(u'\n'.join(output))
        
    def _render_options(self):
        """Returns all image html for the avatars"""
        
        options = ''
        i = 0
        for avatar in self.avatars:
            # TODO : where to get the root image url?
            options += u'<img src="' + settings.MEDIA_URL + settings.SKINS_ROOT + settings.SKIN + '/' + settings.IMAGES_ROOT + avatar.image_path + '" alt="avatar option ' + unicode(i+1) + \
                        '" style="float: left; width: ' + unicode(self.width) + 'px;"/>'
            i += 1
            
        return options
    
    def _render_scripts(self, inner_name, button_left_name, button_right_name, input_name):
        """Returns the necessary javascript"""
        
        avatar_no = unicode(len(self.avatars))
        total_width = unicode(self.width * len(self.avatars))
        
        scripts = u'<script type="text/javascript">\n'
        scripts += 'function f_' + inner_name + '(sig) {\n'
        scripts += "\tvar newLeft = parseInt(" + inner_name + ".style.left) + sig * " + unicode(self.width) + ";\n"
        scripts += "\tvar value = parseInt(" + input_name + ".value);\n"
        scripts += "\tvalue -= sig;\n"
        scripts += "\tif (newLeft > 0) {\n\t\tnewLeft -= " + total_width + ";\n\t\tvalue +=" + avatar_no + ";\n\t}\n"
        scripts += "\tif (newLeft == -" + total_width + ") {\n\t\tnewLeft = 0;\n\t\tvalue -=" + avatar_no + ";\n\t}\n"
        scripts += "\t" + input_name + ".value = value;\n"
        scripts += "\t" + inner_name + ".style.left = newLeft + 'px';\n"
        scripts += "}\n"
        scripts += 'var ' + inner_name + ' = document.getElementById("' + inner_name + '");\n'
        scripts += 'var ' + input_name + ' = document.getElementById("' + input_name + '");\n'
        scripts += 'var ' + button_left_name + ' = document.getElementById("' + button_left_name + '");\n'
        scripts += 'var ' + button_right_name + ' = document.getElementById("' + button_right_name + '");\n'
        scripts += button_left_name + ".onclick = function() { f_" + inner_name + "(1); }\n"
        scripts += button_right_name + ".onclick = function() { f_" + inner_name + "(-1); }\n"
        scripts += '</script>'
        return scripts
    
    def _render_left_button(self, button_left_name):
        """Returns html for the left browse button"""
        button = u'<img id="' + button_left_name + '" src="' + settings.MEDIA_URL + \
                settings.SKINS_ROOT + settings.SKIN + '/' + settings.IMAGES_ROOT + '/widgets/avatarselect/button_left.png"/>'
                
        return button

    def _render_right_button(self, button_right_name):
        """Returns html for the right browse button"""
        button = u'<img id="' + button_right_name + '" src="' + settings.MEDIA_URL + \
                settings.SKINS_ROOT + settings.SKIN + '/' + settings.IMAGES_ROOT + '/widgets/avatarselect/button_right.png"/>'
                
        return button
    