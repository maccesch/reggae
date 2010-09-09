from django.conf import settings
import reggae_settings

# merge django settings with default reggae settings
for attr in dir(reggae_settings):
	if attr == attr.upper() and not hasattr(settings, attr):
		setattr(settings._wrapped, attr, getattr(reggae_settings, attr))
