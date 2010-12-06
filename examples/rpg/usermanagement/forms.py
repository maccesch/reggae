from django import forms
from widgets import AvatarSelect

class PlayerProfileForm(forms.Form):
    
    name = forms.CharField(max_length=50)
    avatar = forms.IntegerField(widget=AvatarSelect)