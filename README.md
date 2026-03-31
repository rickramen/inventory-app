# inventory-app


Tables:
- Pokemon (belongs to type, belongs to trainer)
- Type (has many pokemon)
- Trainer (has many pokemon)

Clean wipe containers <br>
``
docker compose down --rmi all --volumes --remove-orphans
``