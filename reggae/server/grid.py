#from math import floor

# TODO : what about settings?

# edge length of a grid cell in world units
GRID_CELL_SIZE = 512

# TODO : persistent models have to stay in the grid.

class Grid():
    """A quadratic grid where clients are organized based on positions of their points"""
    
    # a dict that maps model element ids to grid coordinates: model id -> (x, y)
    _model_id_to_cell = None
    
    # a dict that maps client ids to a list of grid cells they're in: client id -> [GridCell]
    _client_id_to_cells = None
    
    # a two dim array of cells
    _cells = None
    
    # the edge length of a grid cell in world units
    _cell_size = 0
    
    def __init__(self, total_size):
        """
        Grid constructor. A square with edge length total_size will be covered by grid cells with edge length GRID_CELL_SIZE.
        """
        
        subdivisions = total_size / GRID_CELL_SIZE
        if subdivisions * GRID_CELL_SIZE < total_size:
            subdivisions += 1
            
        self._subdivisions = subdivisions 
        
        self._cells = [[GridCell() for i in range(self._subdivisions)] for i in range(self._subdivisions)]
        
        self._model_id_to_cell = {}
        self._client_id_to_cells = {}
        
        self._cell_size = GRID_CELL_SIZE

    
    def remove_client_and_points(self, client):
        """
        Removes a client and all of its points from the grid.
        Returns a tuple: 
        (set of clients that are interested in knowing this,
        set of points that where removed)
        """

        interested_clients = set()
        removed_points = set()

        for cell in self._client_id_to_cells[client.client_id]:
            removed_points.update(cell.remove_client_and_points(client))
            interested_clients.update(cell.clients)
            
        for point in removed_points:
            del self._model_id_to_cell[point.id]
        
        del self._client_id_to_cells[client.client_id]    
            
        return interested_clients, removed_points
        
    
    def change_point(self, point, client):
        """
        Changes or adds a point which belongs to client in the grid.
        Returns a tuple of lists: (clients that are interested in where the point is,
        clients that were interested the last time this point was changed,
        new points that the client of the point sees now but hasn't seen before,
        old points that the client saw but now doesn't anymore
        """

        x = int(point.x)
        y = int(point.y)

        # integer division => no floor operation needed
        point_belongs_in_grid = ( x/self._cell_size, y/self._cell_size )
        new_x, new_y = point_belongs_in_grid

        # add the point if it isn't in the grid yet
        if not point.id in self._model_id_to_cell:
            self._append_to_cell(point, client=client, *point_belongs_in_grid)
        
        point_is_in_grid = self._model_id_to_cell[point.id]
        
        interested_clients = set()
        former_clients = set()
        new_points = set()
        old_points = set()

        if point_belongs_in_grid != point_is_in_grid:
            self._remove_from_cell(point, client=client, *point_is_in_grid)
            self._append_to_cell(point, client=client, *point_belongs_in_grid)
            
            # get all clients that saw the point
            x, y = point_is_in_grid
            for i in range(max(0, x - 1), min(self._subdivisions, x + 2)):
                for j in range(max(0, y - 1), min(self._subdivisions, y + 2)):
                    former_clients.update(self[i, j].clients)

            delta_x = new_x - x
            delta_y = new_y - y
            if delta_x != 0:
                i = new_x + delta_x
                for j in range(max(0, new_y - 1), min(self._subdivisions, new_y + 2)):
                    new_points.update(self[i, j].points)
                i = x - delta_x
                for j in range(max(0, y - 1), min(self._subdivisions, y + 2)):
                    old_points.update(self[i, j].points)
            if delta_y != 0:
                j = new_y + delta_y
                for i in range(max(0, new_x - 1), min(self._subdivisions, new_x + 2)):
                    new_points.update(self[i, j].points)
                j = y - delta_y
                for i in range(max(0, x - 1), min(self._subdivisions, x + 2)):
                    old_points.update(self[i, j].points)
                    

        else:
            former_clients = interested_clients
            
        # get all clients that should see the point
        for i in range(max(0, new_x - 1), min(self._subdivisions, new_x + 2)):
            for j in range(max(0, new_y - 1), min(self._subdivisions, new_y + 2)):
                interested_clients.update(self[i, j].clients)
                
        return (interested_clients, former_clients, new_points, old_points)
        

    def get_points(self, x, y):
        """
        Returns a list of model elements for all points that are in the region
        which an object at cooridnates (x, y) is interested in.
        """
        x = int(x)/self._cell_size
        y = int(y)/self._cell_size
        points = []
        for i in range(max(0, x - 1), min(self._subdivisions, x + 2)):
            for j in range(max(0, y - 1), min(self._subdivisions, y + 2)):
                points.extend(self[i, j].points)
        
        return points

        
    def get_clients(self, x, y):
        """
        Returns a list of clients for all points that are in the region
        which an object at cooridnates (x, y) is interested in.
        """
        x = int(x)/self._cell_size
        y = int(y)/self._cell_size
        clients = []
        for i in range(max(0, x - 1), min(self._subdivisions, x + 2)):
            for j in range(max(0, y - 1), min(self._subdivisions, y + 2)):
                clients.extend(self[i, j].clients)
        
        return clients

        
    def _remove_from_cell(self, point, x, y, client):
        """Removes a point which belongs to client from cell at (x, y)"""
        del self._model_id_to_cell[point.id]
        
        client_removed = self[x, y].remove_point(point, client)
        if client_removed:
            self._client_id_to_cells[client.client_id].remove(self[x, y])
    
    
    def _append_to_cell(self, point, x, y, client):
        """Adds a point which belongs to client from cell at (x, y)"""
        self._model_id_to_cell[point.id] = (x, y)
        
        client_new = self[x, y].append_point(point, client)
        if client_new:
            if client.client_id in self._client_id_to_cells:
                self._client_id_to_cells[client.client_id].append(self[x, y])
            else:
                self._client_id_to_cells[client.client_id] = [self[x, y]]
    
    
    def __getitem__(self, (x, y)):
        """Returns the grid cell for x and y"""
        return self._cells[x][y]



class GridCell():
    """One cell of Grid"""
    
    def __init__(self):
        
        # all clients that are in this cell
        self._clients = []
        
        # all map client id -> [point]
        self._client_id_to_points = {}
        
    @property
    def clients(self):
        """Returns a list of all clients in the cell"""
        return self._clients

    @property
    def points(self):
        """Returns a list of all points that are in this cell"""
        return [point for client_id in self._client_id_to_points.keys() 
                                            for point in self._client_id_to_points[client_id]]
    
    def append_point(self, point, client):
        """
        Adds a point which belongs to client to this cell.
        Returns True if the client is new to this cell.
        """
        client_id = client.client_id if client else 0
        if client_id in self._client_id_to_points:
            self._client_id_to_points[client_id].append(point)
            return False
        else:
            self._client_id_to_points[client_id] = [point]
            if client:
                self._clients.append(client)
                return True
            else:
                return False


    def remove_point(self, point, client):
        """
        Removes a point which belongs to client to this cell.
        Returns True if the client was removed too,
        because the point was the last of the client beeing in this cell.
        """
        
        client_id = client.client_id if client else 0
        self._client_id_to_points[client_id].remove(point)
        if not self._client_id_to_points[client_id]:
            del self._client_id_to_points[client_id]
            if client:
                self._clients.remove(client)
                return True
            else:
                return False
        else:
            return False
    
    
    def remove_client_and_points(self, client):
        """
        Removes a client and all of its points from the cell.
        Returns a list of points that where removed
        """
        
        removed_points = []
        if client.client_id in self._client_id_to_points:
            removed_points = self._client_id_to_points[client.client_id]
            del self._client_id_to_points[client.client_id]
            self._clients.remove(client)

        return removed_points