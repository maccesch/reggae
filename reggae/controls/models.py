from django.db import models
from django.contrib.auth.models import User

class Control(models.Model):
    """
    A control of a user. For example "Use 'a' to walk to the right".
    """
    input = models.CharField(max_length=10, help_text="Key or mouse button. Valid mouse buttons are: 'lmb', 'rmb' and 'mmb'. For keys use their character ('a' -'z'). TODO : special keys")
    action_id = models.CharField(max_length=10, help_text="The id of the action that should be taken when the key is pressed. See JavaScript GameLogic.prototype.inputActions")
    owner = models.ForeignKey(User, help_text="The user that owns this control.")
    description = models.CharField(max_length=512, help_text="Describes what the control does (=meaning of the action_id)")
    
    def to_realtime_http(self):
        """Serializes this object to a realtime http response "ConTRoL". Returns the serialized object as string."""
        return "ctrl\n" + str(self.input) + "\n" + str(self.action_id) + "\n" + str(self.owner.id)
        
    def __unicode__(self):
        return self.owner.username + " '" + self.input + "' " + self.action_id 