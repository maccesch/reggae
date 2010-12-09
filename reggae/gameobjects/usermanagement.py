
class AbstractUserManager(object):
    """
    Provides some user related methods needed by the server
    """
    
    def check_first_login(self, user):
        """
        If the user has logged for the first time, inital model elements are created and returned in a list.
        An empty list is returned if the user hasn't logged in for the first time.
        """
        if self.is_first_login(user):
            self.create_default_objects(user)
            

    def is_first_login(self, user):
        """
        Returns True if the user has logged in for the first time
        """
        raise NotImplementedError
    

    def create_default_objects(self, user):
        """
        Creates all neccessary database objects for a (new) user
        """
        raise NotImplementedError
    
    
    def get_user_profile(self, user):
        """
        Returns the currently used player profile
        """
        return user.get_profile()


    def create_default_user_profile(self, user):
        """
        Creates a default user profile
        """
        raise NotImplementedError
