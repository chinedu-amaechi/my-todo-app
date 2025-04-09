#!/bin/bash

# Get container IDs
BACKEND_CONTAINER=$(docker ps -qf "name=backend")
FRONTEND_CONTAINER=$(docker ps -qf "name=frontend")

# Get container IPs
BACKEND_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $BACKEND_CONTAINER)
FRONTEND_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $FRONTEND_CONTAINER)

# Create a new chain for rate limiting
iptables -N RATE_LIMIT

# Add rate limiting rules (max 10 connections per second to backend)
iptables -A RATE_LIMIT -d $BACKEND_IP -p tcp --dport 5000 -m state --state NEW -m hashlimit \
  --hashlimit-name backend-limit \
  --hashlimit-above 10/sec \
  --hashlimit-burst 5 \
  --hashlimit-mode srcip \
  -j DROP

# Forward traffic through the RATE_LIMIT chain
iptables -I DOCKER-USER -j RATE_LIMIT

echo "Rate limiting configured for backend IP: $BACKEND_IP"