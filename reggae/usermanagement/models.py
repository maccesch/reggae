from django.db import models
from django.contrib.auth.models import User
from reggae.gameobjectpersistence.models import View, Point

class Avatar(models.Model):
    """Avatar of a player"""
    image_path = models.CharField(max_length="512", help_text="Path of the avatar image relative to images path")
    
    def __unicode__(self):
        return "Avatar " + self.image_path

class PlayerProfile(models.Model):
    """Additional settings for a player"""
    user = models.ForeignKey(User, help_text="The user that this profile is for")
    name = models.CharField(max_length=50, help_text="The player name")
    avatar = models.ForeignKey(Avatar, help_text="The avatar of the player")
    
    def __unicode__(self):
        return "PlayerProfile " + self.user.username + ' "' + self.name + '"'
    
    
class AvatarView(View):
    player_profile = models.ForeignKey(PlayerProfile, help_text="The player profile with the avatar that the image of this view should be taken from")
    
    def to_realtime_http(self):
        """Serializes this object to a realtime http response "New SimpleImageView". Returns the serialized object as string."""
        return "nsiv\n" + str(self.model.id) + "\n" + str(self.player_profile.avatar.image_path) + "\n" + \
            str(self.bias_left) + "\n" + str(self.bias_top) + "\n" + str(self.model.owner_id)

    def __unicode__(self):
        return "AvatarView " + self.player_profile.avatar.image_path + " " + self.model.owner.username

    
class ViewPlayerNameDecoration(models.Model):
    """A decoration of a view. The view is decorated with the player name. For more documentation see ModelFacade._onNewViewStringDecorationReceive()"""
    model = models.ForeignKey(Point)
    player_profile = models.ForeignKey(PlayerProfile)
    
    def to_realtime_http(self):
        """Serializes this object to a realtime http response "New View String Decoration". Returns the serialized object as string."""
        return "nvsd\n" + str(self.model.id) + "\n" + str(self.player_profile.name) + "\n" + str(self.model.owner_id)
    
    def __unicode__(self):
        return "ViewPlayerNameDecoration " + self.player_profile.name