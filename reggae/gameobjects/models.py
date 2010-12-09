from django.db import models
from django.contrib.auth.models import User


class Point(models.Model):
    """For additional documentation see the JavaScript class with the same name"""
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    owner = models.ForeignKey(User, help_text="The owner of the object")
    persistent = models.BooleanField(help_text="If true the object stays visible regardless of the user logged in or out")
    
    def to_realtime_http(self):
        """Serializes this object to a realtime http response "New Point". Returns the serialized object as string."""
        return "np\n" + str(self.id) + "\n" + str(self.x) + "\n" + str(self.y) + " \n" + str(self.z) + "\n" + \
            str(1 if self.persistent else 0) + "\n" + str(self.owner_id)
    
    def __unicode__(self):
        return "Point (" + str(self.x) + ", " + str(self.y) + ", " + str(self.z) + ") " + self.owner.username


class MovingPoint(Point):
    """For additional documentation see the JavaScript class with the same name"""
    vx = models.FloatField()
    vy = models.FloatField()
    vz = models.FloatField()

    def to_realtime_http(self):
        """Serializes this object to a realtime http response "New MovingPoint". Returns the serialized object as string."""
        return "nmp\n" + str(self.id) + "\n" + str(self.x) + "\n" + str(self.y) + " \n" + str(self.z) + "\n" + \
            str(self.vx) + "\n" + str(self.vy) + " \n" + str(self.vz) + "\n" + str(1 if self.persistent else 0) + "\n" + str(self.owner_id)

    def __unicode__(self):
        return "MovingPoint (" + str(self.x) + ", " + str(self.y) + ", " + str(self.z) + ") v^2=" + str(self.vx*self.vx+self.vy*self.vy+self.vz*self.vz) + " " + self.owner.username

    
class Wall(Point):
    """
    A Wall is an obstacle in the world which is a planar quad orthogonal to the ground.
    It is described by its base line (the line where the quad hits the ground. That is
    from (x, y, z) to (x2, y2, z)) and its height.
    """
    
    x2 = models.FloatField(help_text="X coordinate of the second end of the base line in world units")
    y2 = models.FloatField(help_text="Y coordinate of the second end of the base line in world units")
    height = models.FloatField(help_text="Height of the wall in world units")
    
    def __unicode__(self):
        return "Wall (" + str(self.x1) + ", " + str(self.y1) + "; " + str(self.x2) + ", " + str(self.y2) + ")"
    
    def to_realtime_http(self):
        """Serializes this object to a realtime http response "New Wall". Returns the serialized object as string."""
        return "nw\n" + str(self.id) + "\n" + str(self.x) + "\n" + str(self.y) + "\n" + str(self.x2) + \
             "\n" + str(self.y2) + "\n" + str(self.z) + "\n" + str(self.height) + "\n" + str(self.owner_id)


class View(models.Model):
    """Abstract base class for views"""
    model = models.OneToOneField(Point, help_text="The model this view represents")
    bias_left = models.CharField(max_length=20, default="0", help_text="Horizontal bias of the pivot point relative to the top left corner of the image in pixels")
    bias_top = models.CharField(max_length=20, default="0", help_text="Vertical bias of the pivot point relative to the top left corner of the image in pixels")
    
    class Meta:
        abstract = True
 
        
class SimpleImageView(View):
    """For additional documentation see the JavaScript class with the same name"""
    image_path = models.CharField(max_length=512, help_text="Path of the views image relative to images path")
    
    def to_realtime_http(self):
        """Serializes this object to a realtime http response "New SimpleImageView". Returns the serialized object as string."""
        return "nsiv\n" + str(self.model.id) + "\n" + str(self.image_path) + "\n" + \
            str(self.bias_left) + "\n" + str(self.bias_top) + "\n" + str(self.model.owner_id)

    def __unicode__(self):
        return "SimpleImageView " + self.image_path + " " + self.model.owner.username
    

# TODO : move this to app "building"    
class SimpleImageBuildingView(View):
    """For additional documentation see the JavaScript class with the same name"""
    image_path = models.CharField(max_length=512, help_text="Path of the views image relative to images path")
    
    left1 = models.SmallIntegerField()
    top1 = models.SmallIntegerField()
    left2 = models.SmallIntegerField()
    top2 = models.SmallIntegerField()
    
    def to_realtime_http(self):
        """Serializes this object to a realtime http response "New SimpleImageBuildingView". Returns the serialized object as string."""
        return "nsibv\n" + str(self.model.id) + "\n" + str(self.image_path) + "\n" + \
            str(self.left1) + "\n" + str(self.top1) + "\n" + \
            str(self.left2) + "\n" + str(self.top2) + "\n" + str(self.model.owner_id)
    
    def __unicode__(self):
        return "SimpleImageBuildingView " + self.image_path + " " + self.model.owner.username
