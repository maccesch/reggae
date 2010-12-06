from django.shortcuts import render_to_response
from django.http import HttpResponseRedirect
from django.conf import settings
# from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse

# @login_required
def main(request):
    """Main view. Here everything starts. :-)"""
    
    # check if the user has created a player profile yet
    if not request.user.is_authenticated() or request.user.playerprofile_set.count() > 0:
        return render_to_response("gamemain/main.html", {
                                        'version': settings.GAME_VERSION,
                                        'name': settings.GAME_NAME,
                                        'user': request.user,
                                   })
    else:
        return HttpResponseRedirect(reverse('usermanagement.views.player_profile_creation'))
