#!/bin/bash

echo "🔧 Configurando MySQL per accesso esterno..."

# Backup della configurazione originale
sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf.backup

# Modifica bind-address per accettare connessioni da tutte le interfacce
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf

# Abilita l'accesso remoto per l'utente root
mysql -u root -pS@miro2006 -e "CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'S@miro2006';"
mysql -u root -pS@miro2006 -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;"
mysql -u root -pS@miro2006 -e "FLUSH PRIVILEGES;"

# Riavvia MySQL
sudo systemctl restart mysql

echo "✅ MySQL configurato per accesso esterno"
echo "⚠️  ATTENZIONE: Questo rende MySQL accessibile dall'esterno!"
echo "🔒 Assicurati di avere un firewall configurato correttamente"

# Verifica la configurazione
echo "🔍 Verificando la configurazione..."
netstat -tlnp | grep :3306
