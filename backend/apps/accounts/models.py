# apps/accounts/models.py
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    # جلوگیری از تداخل reverse accessor
    groups = models.ManyToManyField(
        Group,
        related_name="custom_user_set",  # <-- اینجا تغییر دادیم
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_permissions_set",  # <-- اینجا هم تغییر
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )
    