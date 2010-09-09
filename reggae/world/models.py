from django.db import models
from django.db.models import Q
from django.db.models.aggregates import Max
from django.contrib.auth.models import User

#from building.models import *
#from trading.models import Item
from reggae.world.settings import FIELD_SIZE
from reggae.gameobjectpersistence.models import Point, Wall


#class Coordinates(models.Model):
#    x = models.FloatField()
#    y = models.FloatField()
#    z = models.FloatField()

#class BuildingCoordinates(models.Model):
#    building = models.OneToOneField(Building)
#    coordinates = models.ForeignKey(Coordinates)
    
#class BuildingClassRepresentation(models.Model):
#    building_class = models.OneToOneField(BuildingClass)
#    walls = models.ManyToManyField(Wall)
#    base_image = models.ImageField(upload_to="images/buildings")
    
#class ItemCoordinates(models.Model):
#    item = models.ForeignKey(Item)
#    number = models.IntegerField()
#    coordinates = models.OneToOneField(Coordinates)

class World(models.Model):
    """The game world."""
    
    name = models.CharField(max_length=255, help_text="The name of this world")

    def get_width(self):
        """Returns the total width of the world in world units"""
        return (self.fields.aggregate(Max('x'))['x__max'] + 1) * FIELD_SIZE
    
    def get_height(self):
        """Returns the total height of the world in world units"""
        return (self.fields.aggregate(Max('y'))['y__max'] + 1) * FIELD_SIZE
    
    def get_fields_for_rect(self, x1, y1, x2, y2):
        """
        Returns a QuerySet that represents all fields that are in the 
        rectangle specified by the method arguments. All arguments are in world units.
        """
        return self.fields.filter(x__gte=x1/FIELD_SIZE, x__lt=x2/FIELD_SIZE, y__gte=y1/FIELD_SIZE, y__lt=y2/FIELD_SIZE)
    
    def get_walls_for_rect(self, x1, y1, x2, y2):
        """
        Returns a QuerySet that represents all walls that have at least one endpoint in the 
        rectangle specified by the method arguments. All arguments are in world units.
        """
        walls = Wall.objects.filter((Q(x__gte=x1) & Q(x__lte=x2) & Q(y__gte=y1) & Q(y__lte=y2)) | \
                                  (Q(x2__gte=x1) & Q(x2__lte=x2) & Q(y2__gte=y1) & Q(y2__lte=y2)))
        return walls
        
    def __unicode__(self):
        return "World " + self.name


class WorldView(models.Model):
    """The main view of the game. See WorldView.js"""
    
    centerX = models.IntegerField(help_text="X coordinate of the center of the world view in world units")
    centerY = models.IntegerField(help_text="Y coordinate of the center of the world view in world units")
    centerZ = models.IntegerField(help_text="Z coordinate of the center of the world view in world units")
    
    follow_model = models.ForeignKey(Point, null=True, blank=True, help_text="If not null the center of the world view stays at this model all the time")
    
    owner = models.ForeignKey(User, help_text="The ownser of this view")
    
    def to_realtime_http(self):
        """
        Serializes this object to a realtime http response "New WorldView"
        """
        return "nwv\n" + str(self.centerX) + '\n' + str(self.centerY) + '\n' + str(self.centerZ) + '\n' + str(self.owner.id)
    
                    
    def follow_to_realtime_http(self):
        """
        Creates a realtime http response "WorldView Follow Model" if follow_model is not null
        """
        return "wvfm\n" + str(self.follow_model.id) + "\n" + str(self.follow_model.owner.id) if self.follow_model is not None else "" 
    
    
    def __unicode__(self):
        return "WorldView (" + unicode(self.centerX) + ", " + unicode(self.centerY) + ", " + unicode(self.centerZ) + ") " + self.owner.username
    

class FieldClass(models.Model):
    """The class (=type) of a world field"""
    
    TYPE_CHOICES = (
        (1, 'Floor'),
        (2, 'Wall'),
        (3, 'Fence'),
    )
    
    image = models.CharField(max_length=256, help_text="The absolute image path for this field class")
#    type = models.SmallIntegerField(choices=TYPE_CHOICES, help_text="The basic type of this field class")
    
    # every class that has the same type and family is one variation
#    family = models.SmallIntegerField(default=0, help_text="A number that specifies a subtype")
    
    def __unicode__(self):
        return "Field class " + unicode(self.image)

class Field(models.Model):
    """A ground field of the world"""
    
    field_class = models.ForeignKey(FieldClass)
    
    # in field units (= world_units // settings.FIELD_SIZE)
    x = models.IntegerField()
    y = models.IntegerField()
    z = models.IntegerField()
    world = models.ForeignKey(World, related_name='fields')
    
    def get_world_x(self):
        return self.x * FIELD_SIZE;

    def get_world_y(self):
        return self.y * FIELD_SIZE;
    
    def __unicode__(self):
        return "Field (" + str(self.x) + ", " + str(self.y) + ", " + str(self.z) + ") in " + str(self.world)
