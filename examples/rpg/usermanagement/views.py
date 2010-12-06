from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.core.urlresolvers import reverse
from django.shortcuts import render_to_response
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required

from models import PlayerProfile
from forms import PlayerProfileForm


def user_creation(request):
    """Shows a form to create a new user"""
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password1'])
            login(request, user)
            return HttpResponseRedirect(reverse(player_profile_creation))
    else:
        form = UserCreationForm()
        
    return render_to_response("registration/user_creation_form.html", { 'form': form })
        
def user_creation_done(request):
    """Confirms completion of creation of a new user"""
    return render_to_response("registration/user_creation_done.html", {})

@login_required
def player_profile_creation(request):
    """Creates or edits a player profile. GAME_CODE"""
    if request.method == 'POST': 
        form = PlayerProfileForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']
            avatar = form.cleaned_data['avatar']
            
            try:
                profile = request.user.playerprofile_set.all()[0]
            except:
                profile = PlayerProfile()
            
            profile.name = name
            profile.avatar_id = avatar
            profile.user = request.user
            profile.save()
            
            return HttpResponseRedirect(reverse(user_creation_done))
    else:
        # is there already a player profile?
        # if you want to have multiple profiles per player you have to change this
        try:
            profile = request.user.playerprofile_set.all()[0]
            form = PlayerProfileForm({ 'name': profile.name, 'avatar': profile.avatar_id })
        except:
            form = PlayerProfileForm()

    return render_to_response('registration/player_profile_form.html', {
        'form': form,
    })
