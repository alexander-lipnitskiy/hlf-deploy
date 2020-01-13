For anyone that does not wish to completely purge AppArmor.

Check status: sudo aa-status

Shutdown and prevent it from restarting: sudo systemctl disable apparmor.service --now

Unload AppArmor profiles: sudo service apparmor teardown

Check status: sudo aa-status

You should now be able to stop/kill containers