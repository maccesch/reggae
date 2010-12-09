from reggae.gameobjects.usermanagement import AbstractUserManager
from reggae.gameobjects.models import MovingPoint
from models import AvatarView, ViewPlayerNameDecoration, Avatar,\
    PlayerProfile
from reggae.world.models import WorldView
from random import random
from reggae.controls.models import Control

class UserManager(AbstractUserManager):

    def is_first_login(self, user):
        """
        Returns True if the user has logged in for the first time
        """
        return MovingPoint.objects.filter(owner__exact=user).count() == 0
    

    def create_default_objects(self, user):
        """
        Creates all neccessary database objects for a (new) user
        """
        
        # create world objects
        mp = MovingPoint(vx=0, vy=0, vz=0)
        mp.x=random()*700 + 21 * 64
        mp.y=random()*500 + 21 * 64
        mp.z=0
        mp.owner=user
        mp.persistence=False
        mp.element_id=1
        mp.save()
    
        wv = WorldView(centerX=mp.x, centerY=mp.y, centerZ=mp.z, follow_model=mp, owner=user)
        wv.save()
        
        profile = self.get_user_profile(user)
        
        av = AvatarView(model=mp, player_profile=profile, bias_left=32, bias_top=64)
        av.save()
        
        vd = ViewPlayerNameDecoration(model=mp, player_profile=profile)
        vd.save()
        
        # create default controls
        Control(owner=user, input="a", action_id="left", description="Move to the left").save()
        Control(owner=user, input="d", action_id="right", description="Move to the right").save()
        Control(owner=user, input="w", action_id="top", description="Move to the top").save()
        Control(owner=user, input="s", action_id="bottom", description="Move to the bottom").save()
        Control(owner=user, input="c", action_id="chat", description="Start chat").save()
        

    
    def create_default_user_profile(self, user):
        """
        Creates a default user profile
        """
        avatar = Avatar(image_path='avatars/shortbrown.png')
        avatar.save()
        
        profile = PlayerProfile(user=user, name=user.username, avatar=avatar)
        profile.save()
        return profile
        
