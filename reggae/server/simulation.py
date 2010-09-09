from reggae.gameobjectpersistence.models import MovingPoint, Point

class Simulator():
    """Runs a persistent simulation of the world."""
    
    def __init__(self):
        
        # a map of all model elements that are simulated: element_id -> element
        self._elements = {}
    
    
    def add_moving_point_by_id(self, element_id):
        """Adds a moving point to the simulation identified by the arguments"""
        
        moving_point = MovingPoint.objects.get(id=element_id)
        self._elements[element_id] = moving_point
        
    def add_moving_point(self, moving_point):
        """Adds a moving point to the simulation"""
        self._elements[moving_point.id] = moving_point
       
        
    def change_moving_point(self, element_id, x, y, z, vx, vy, vz):
        """Changes the state (position and velocity) of a element identified by the element_id. Returns the element."""
        
        # TODO : check validity of the change
        
        moving_point = self._elements[element_id]
        moving_point.x = x
        moving_point.y = y
        moving_point.z = z
        moving_point.vx = vx
        moving_point.vy = vy
        moving_point.vz = vz
        
        return moving_point
        
        
    def get_element(self, element_id):
        """Returns the model element of the given id."""
        return self._elements[element_id];    
        
        
    def remove_points(self, points):
        """Removes all given points from the simulation"""
        for point in points:
            del self._elements[point.id]
     
        
    def update(self, delta_t):
        """Updates simulation state. Time since last update is delta_t milliseconds"""
        
        for el in self._elements.values():
            # TODO : create update methods for all model elements
            el.update(delta_t)