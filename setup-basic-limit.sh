#!/bin/bash

# Create a new chain for rate limiting
sudo iptables -N LIMIT_CONN

# Basic connection limiting rules
sudo iptables -A LIMIT_CONN -p tcp --dport 5000 -m connlimit --connlimit-above 20 -j REJECT
sudo iptables -A LIMIT_CONN -p tcp --dport 3000 -m connlimit --connlimit-above 30 -j REJECT

# Add the chain to INPUT
sudo iptables -I INPUT -j LIMIT_CONN

echo "Basic connection limiting rules configured."
