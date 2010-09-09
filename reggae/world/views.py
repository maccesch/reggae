from django.shortcuts import render_to_response
from django.core import serializers
from django.http import HttpResponse

from models import World, FieldClass, Field
from reggae.world.settings import FIELD_SIZE

def _get_current_world(request):
    # TODO : current world?
    return World.objects.get(pk=1)

def get_world_rect(request, x1, y1, x2, y2):
    x1 = int(x1)
    y1 = int(y1)
    x2 = int(x2)
    y2 =int(y2)
    world = _get_current_world(request)
    fields = world.get_fields_for_rect(x1, y1, x2, y2)
    for field in fields:
        field.x *= FIELD_SIZE
        field.y *= FIELD_SIZE
    
    walls = world.get_walls_for_rect(x1, y1, x2, y2)

    return render_to_response('world/world_rect.xml', {'fields': fields,
                                                       'walls': walls,                                                       
                                                       }, mimetype='text/xml')

    
def get_all_field_classes(request):
    response = HttpResponse()
    json_serializer = serializers.get_serializer("json")()
    json_serializer.serialize(FieldClass.objects.all(), stream=response)
    return response

def editor(request):
    world = _get_current_world(request)
    
    if request.method == 'GET':
        return render_to_response('world/editor.html',
                                  { 'field_classes': FieldClass.objects.all(),
                                    'world': world,
                                    'field_size': FIELD_SIZE,
                                   })
        
    elif request.method == 'POST':
        # TODO : secure!
        world = World.objects.get(id=request.POST['world_id'])
        for f in world.fields.all():
            f.delete()
            
        fields_str = request.POST['fields']
        fields = fields_str.split('|');
        
        for field_str in fields:
            x, y, z, class_id = field_str.split(',')
            field = Field(x=int(x), y=int(y), z=int(z), 
                          field_class=FieldClass.objects.get(id=int(class_id)),
                          world=world)
            field.save();
            
        return HttpResponse('World saved');