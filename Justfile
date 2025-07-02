migrate: docker-up
    docker compose exec average-character-cloud-backend average-character-cloud-backend migrate

migrate-storage: docker-up
    docker compose exec average-character-cloud-backend average-character-cloud-backend migrate-storage

docker-up:
    docker compose up -d

serve: migrate migrate-storage
    npm run dev
