// Script para restaurar usuarios que ya habían diligenciado
const UsersDatabase = require('./database/users-db');

const usersData = [
  { id: 1, name: "daniel talero", area: "Aliados", country: "Colombia", exit_date: "21/8/2025", rating: "7/10", response_date: "21/8/2025" },
  { id: 2, name: "Leany Montero", area: "Customer Success", country: "Colombia", exit_date: "9/7/2025", rating: "3/10", response_date: "21/8/2025" },
  { id: 3, name: "Beatriz Alvarez", area: "Customer Success", country: "México", exit_date: "28/7/2025", rating: "8/10", response_date: "21/8/2025" },
  { id: 4, name: "Jesus Ramirez", area: "Sales", country: "Colombia", exit_date: "28/7/2025", rating: "7/10", response_date: "21/8/2025" },
  { id: 5, name: "Sandra Riaño", area: "People Ops", country: "Colombia", exit_date: "3/7/2025", rating: "10/10", response_date: "21/8/2025" },
  { id: 6, name: "Viviana Estrada", area: "Sales", country: "México", exit_date: "5/7/2025", rating: "10/10", response_date: "21/8/2025" },
  { id: 7, name: "Leidis Teheran", area: "Sales", country: "Colombia", exit_date: "28/7/2025", rating: "10/10", response_date: "21/8/2025" },
  { id: 8, name: "Angie Rodriguez", area: "Customer Success", country: "Colombia", exit_date: "24/7/2025", rating: "8/10", response_date: "22/8/2025" },
  { id: 9, name: "Roger Guzman", area: "Sales", country: "Colombia", exit_date: "28/6/2025", rating: "1/10", response_date: "22/8/2025" },
  { id: 10, name: "Jessica Ramirez", area: "Marketing", country: "Colombia", exit_date: "25/6/2025", rating: "10/10", response_date: "22/8/2025" },
  { id: 11, name: "Paola Acevedo", area: "Marketing", country: "México", exit_date: "27/6/2025", rating: "5/10", response_date: "22/8/2025" },
  { id: 12, name: "Edison Cagua", area: "Sales", country: "Colombia", exit_date: "2/7/2025", rating: "9/10", response_date: "22/8/2025" },
  { id: 13, name: "Luz Matabajoy", area: "Sales", country: "México", exit_date: "28/7/2025", rating: "8/10", response_date: "22/8/2025" },
  { id: 14, name: "Jhon Canizales", area: "Customer Success", country: "Colombia", exit_date: "10/6/2025", rating: "10/10", response_date: "22/8/2025" },
  { id: 15, name: "Paula Delgado", area: "Marketing", country: "Colombia", exit_date: "25/6/2025", rating: "1/10", response_date: "22/8/2025" },
  { id: 16, name: "Karen Melendez", area: "Sales", country: "Colombia", exit_date: "25/6/2025", rating: "1/10", response_date: "22/8/2025" },
  { id: 17, name: "Yenny Leal", area: "Sales", country: "Colombia", exit_date: "19/6/2025", rating: "5/10", response_date: "22/8/2025" },
  { id: 18, name: "Adriana Sanabria", area: "Customer Success", country: "Colombia", exit_date: "27/6/2025", rating: "10/10", response_date: "22/8/2025" },
  { id: 19, name: "Neidy Jimenez", area: "Customer Success", country: "Ecuador", exit_date: "11/6/2025", rating: "5/10", response_date: "22/8/2025" },
  { id: 20, name: "Maria Ramirez", area: "Sales", country: "Colombia", exit_date: "1/7/2025", rating: "10/10", response_date: "22/8/2025" },
  { id: 21, name: "Karen Escobar", area: "Sales", country: "Colombia", exit_date: "11/6/2025", rating: "7/10", response_date: "22/8/2025" },
  { id: 22, name: "Cristian Navia", area: "Customer Success", country: "Colombia", exit_date: "24/6/2025", rating: "8/10", response_date: "22/8/2025" },
  { id: 23, name: "Cristian Coronado", area: "Customer Success", country: "Colombia", exit_date: "11/7/2025", rating: "5/10", response_date: "22/8/2025" },
  { id: 24, name: "Sergio Cardona", area: "Sales", country: "Colombia", exit_date: "9/6/2025", rating: "10/10", response_date: "22/8/2025" },
  { id: 25, name: "Daniela Labao", area: "Sales", country: "Colombia", exit_date: "30/6/2025", rating: "8/10", response_date: "22/8/2025" },
  { id: 26, name: "Leysli Rojas", area: "Sales", country: "Colombia", exit_date: "28/7/2025", rating: "10/10", response_date: "22/8/2025" }
];

function convertDateFormat(dateStr) {
  // Convert from "28/7/2025" to "2025-07-28"
  const parts = dateStr.split('/');
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

async function restoreUsers() {
  try {
    const usersDb = new UsersDatabase();
    
    console.log('Iniciando restauración de usuarios...');
    
    for (const userData of usersData) {
      const nameParts = userData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const userToInsert = {
        first_name: firstName,
        last_name: lastName,
        identification: `ID-${userData.id.toString().padStart(3, '0')}`, // Generar ID temporal
        phone: null, // No tenemos datos de teléfono
        exit_date: convertDateFormat(userData.exit_date),
        area: userData.area,
        country: userData.country,
        fechaInicio: null,
        cargo: null,
        subArea: null,
        lider: null,
        liderEntrenamiento: null,
        paisContratacion: userData.country
      };
      
      try {
        const newId = await usersDb.addUser(userToInsert);
        console.log(`✓ Usuario restaurado: ${userData.name} (ID: ${newId})`);
      } catch (error) {
        console.error(`✗ Error restaurando ${userData.name}:`, error.message);
      }
    }
    
    console.log('\n=== RESTAURACIÓN COMPLETADA ===');
    console.log(`Total de usuarios a restaurar: ${usersData.length}`);
    
    // Verificar la restauración
    const allUsers = await usersDb.getAllUsers();
    console.log(`Usuarios restaurados en la base de datos: ${allUsers.length}`);
    
    usersDb.close();
    
  } catch (error) {
    console.error('Error durante la restauración:', error);
  }
}

restoreUsers();