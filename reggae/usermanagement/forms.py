from django import forms
from widgets import *

class PlayerProfileForm(forms.Form):
    
    name = forms.CharField(max_length=50)
    avatar = forms.IntegerField(widget=AvatarSelect)