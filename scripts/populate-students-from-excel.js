const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('Environment variables loaded');

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing required Firebase Admin environment variables');
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);
const auth = getAuth(app);

const studentsData = [{"no": 1, "nama": "Afiqah Dwi Salsabila", "kelas": "6 A", "nisn": "0141437500", "password": "afiqah7500", "email": "afiqah.7500@students.pppl.id"}, {"no": 2, "nama": "Alif Al-Hafizhimansyah", "kelas": "6 A", "nisn": "0127261091", "password": "alif1091", "email": "alif.1091@students.pppl.id"}, {"no": 3, "nama": "Alika Naura Putri", "kelas": "6 A", "nisn": "0135009650", "password": "alika9650", "email": "alika.9650@students.pppl.id"}, {"no": 4, "nama": "ARETHA HASNAA AZ ZAHRAA", "kelas": "6 A", "nisn": "3137227672", "password": "aretha7672", "email": "aretha.7672@students.pppl.id"}, {"no": 5, "nama": "ARJUNA KENZOU ALVARO MULYANTO", "kelas": "6 A", "nisn": "0134349152", "password": "arjuna9152", "email": "arjuna.9152@students.pppl.id"}, {"no": 6, "nama": "Arkan Labib Al Hakim", "kelas": "6 A", "nisn": "3132800533", "password": "arkan0533", "email": "arkan.0533@students.pppl.id"}, {"no": 7, "nama": "CESAR AHZA ALFARIELL", "kelas": "6 A", "nisn": "0134418962", "password": "cesar8962", "email": "cesar.8962@students.pppl.id"}, {"no": 8, "nama": "DIAH AYU KUSUMAWARDHANI", "kelas": "6 A", "nisn": "0135384746", "password": "diah4746", "email": "diah.4746@students.pppl.id"}, {"no": 9, "nama": "Faatih Kusuma Ramadhan", "kelas": "6 A", "nisn": "3138403147", "password": "faatih3147", "email": "faatih.3147@students.pppl.id"}, {"no": 10, "nama": "Fifi Ashtria Mukti", "kelas": "6 A", "nisn": "3142227866", "password": "fifi7866", "email": "fifi.7866@students.pppl.id"}, {"no": 11, "nama": "Mikie Aulia Fitri", "kelas": "6 A", "nisn": "0132974226", "password": "mikie4226", "email": "mikie.4226@students.pppl.id"}, {"no": 12, "nama": "Moh. Alfarezio Manumpil", "kelas": "6 A", "nisn": "3136840384", "password": "moh.0384", "email": "moh.0384@students.pppl.id"}, {"no": 13, "nama": "Muhamad Iqbal Pratama", "kelas": "6 A", "nisn": "0132725163", "password": "muhamad5163", "email": "muhamad.5163@students.pppl.id"}, {"no": 14, "nama": "MUHAMMAD ARRAYYAN", "kelas": "6 A", "nisn": "0132750493", "password": "muhammad0493", "email": "muhammad.0493@students.pppl.id"}, {"no": 15, "nama": "Nadilla Kirana Sudarmawan", "kelas": "6 A", "nisn": "3133460076", "password": "nadilla0076", "email": "nadilla.0076@students.pppl.id"}, {"no": 16, "nama": "Nafisha Sekar Myisha Kirana", "kelas": "6 A", "nisn": "0131813962", "password": "nafisha3962", "email": "nafisha.3962@students.pppl.id"}, {"no": 17, "nama": "Naufal Syafiq Ramadhan", "kelas": "6 A", "nisn": "3139495469", "password": "naufal5469", "email": "naufal.5469@students.pppl.id"}, {"no": 18, "nama": "Nazwa Amelia Putri", "kelas": "6 A", "nisn": "0134048717", "password": "nazwa8717", "email": "nazwa.8717@students.pppl.id"}, {"no": 19, "nama": "Panji Junito Putra Pereira", "kelas": "6 A", "nisn": "0133433053", "password": "panji3053", "email": "panji.3053@students.pppl.id"}, {"no": 20, "nama": "Rafif Putra Kasi", "kelas": "6 A", "nisn": "3133388927", "password": "rafif8927", "email": "rafif.8927@students.pppl.id"}, {"no": 21, "nama": "SALSABILA NAKHWA ZORA", "kelas": "6 A", "nisn": "0131196610", "password": "salsabila6610", "email": "salsabila.6610@students.pppl.id"}, {"no": 22, "nama": "SANDY OKZHA FAUZAR LATIF", "kelas": "6 A", "nisn": "0137925712", "password": "sandy5712", "email": "sandy.5712@students.pppl.id"}, {"no": 23, "nama": "SATYA NUGRAHA", "kelas": "6 A", "nisn": "0139040461", "password": "satya0461", "email": "satya.0461@students.pppl.id"}, {"no": 24, "nama": "Shezia Erena Sriyono", "kelas": "6 A", "nisn": "3138746057", "password": "shezia6057", "email": "shezia.6057@students.pppl.id"}, {"no": 25, "nama": "Syafik Al Nazhar", "kelas": "6 A", "nisn": "3138382623", "password": "syafik2623", "email": "syafik.2623@students.pppl.id"}, {"no": 26, "nama": "Zhahira Mustika Dwi Widjayanti", "kelas": "6 A", "nisn": "0134656219", "password": "zhahira6219", "email": "zhahira.6219@students.pppl.id"}, {"no": 27, "nama": "AMELINA IRA VONNA", "kelas": "6 B", "nisn": "0136290094", "password": "amelina0094", "email": "amelina.0094@students.pppl.id"}, {"no": 28, "nama": "Ashiila Salsabila", "kelas": "6 B", "nisn": "0146165746", "password": "ashiila5746", "email": "ashiila.5746@students.pppl.id"}, {"no": 29, "nama": "Athar Rizky Yudistira", "kelas": "6 B", "nisn": "3130127251", "password": "athar7251", "email": "athar.7251@students.pppl.id"}, {"no": 30, "nama": "Aydin Naufal Pradipto", "kelas": "6 B", "nisn": "3142121310", "password": "aydin1310", "email": "aydin.1310@students.pppl.id"}, {"no": 31, "nama": "EMILY ZHAFIRA", "kelas": "6 B", "nisn": "0144350236", "password": "emily0236", "email": "emily.0236@students.pppl.id"}, {"no": 32, "nama": "Farrel Daniswara Amsyar", "kelas": "6 B", "nisn": "3134064682", "password": "farrel4682", "email": "farrel.4682@students.pppl.id"}, {"no": 33, "nama": "Fionauli Simanullang", "kelas": "6 B", "nisn": "0137675803", "password": "fionauli5803", "email": "fionauli.5803@students.pppl.id"}, {"no": 34, "nama": "Gracia Theodora Fernandez", "kelas": "6 B", "nisn": "3130982695", "password": "gracia2695", "email": "gracia.2695@students.pppl.id"}, {"no": 35, "nama": "HUSNUL FADHILA SAMBAS", "kelas": "6 B", "nisn": "3137967065", "password": "husnul7065", "email": "husnul.7065@students.pppl.id"}, {"no": 36, "nama": "Jihan Audrina", "kelas": "6 B", "nisn": "3134651878", "password": "jihan1878", "email": "jihan.1878@students.pppl.id"}, {"no": 37, "nama": "Lutfhia Aurelia Thalita Lessy", "kelas": "6 B", "nisn": "0141717654", "password": "lutfhia7654", "email": "lutfhia.7654@students.pppl.id"}, {"no": 38, "nama": "Muhamad Farhan", "kelas": "6 B", "nisn": "0131976116", "password": "muhamad6116", "email": "muhamad.6116@students.pppl.id"}, {"no": 39, "nama": "Muhammad Al Faeyza", "kelas": "6 B", "nisn": "3136332395", "password": "muhammad2395", "email": "muhammad.2395@students.pppl.id"}, {"no": 40, "nama": "Muhammad Alief Ardiansyah", "kelas": "6 B", "nisn": "3135575551", "password": "muhammad5551", "email": "muhammad.5551@students.pppl.id"}, {"no": 41, "nama": "Nabila Hasna Amira Wahyu", "kelas": "6 B", "nisn": "0145620768", "password": "nabila0768", "email": "nabila.0768@students.pppl.id"}, {"no": 42, "nama": "Nabilla Leytisha Amelia", "kelas": "6 B", "nisn": "3143646683", "password": "nabilla6683", "email": "nabilla.6683@students.pppl.id"}, {"no": 43, "nama": "Najma Rizky Maulida", "kelas": "6 B", "nisn": "3144222492", "password": "najma2492", "email": "najma.2492@students.pppl.id"}, {"no": 44, "nama": "Ozil Reza Setiawan", "kelas": "6 B", "nisn": "0137973513", "password": "ozil3513", "email": "ozil.3513@students.pppl.id"}, {"no": 45, "nama": "Radithya Arka Pratama", "kelas": "6 B", "nisn": "0136433599", "password": "radithya3599", "email": "radithya.3599@students.pppl.id"}, {"no": 46, "nama": "Raisha Ajwa Qonita", "kelas": "6 B", "nisn": "0136510514", "password": "raisha0514", "email": "raisha.0514@students.pppl.id"}, {"no": 47, "nama": "Rakha Khairul Azam", "kelas": "6 B", "nisn": "0136980264", "password": "rakha0264", "email": "rakha.0264@students.pppl.id"}, {"no": 48, "nama": "Renata Andraya", "kelas": "6 B", "nisn": "0142784933", "password": "renata4933", "email": "renata.4933@students.pppl.id"}, {"no": 49, "nama": "Ricardo Hieronimus Darius", "kelas": "6 B", "nisn": "0135001308", "password": "ricardo1308", "email": "ricardo.1308@students.pppl.id"}, {"no": 50, "nama": "Ricky Aditya Yudha", "kelas": "6 B", "nisn": "3130906060", "password": "ricky6060", "email": "ricky.6060@students.pppl.id"}, {"no": 51, "nama": "Shakira Aisyah Alya", "kelas": "6 B", "nisn": "3143381675", "password": "shakira1675", "email": "shakira.1675@students.pppl.id"}, {"no": 52, "nama": "Siti Nafisyah Kholfi Zahra", "kelas": "6 B", "nisn": "0137036094", "password": "siti6094", "email": "siti.6094@students.pppl.id"}, {"no": 53, "nama": "Zahra Micheila Putri", "kelas": "6 B", "nisn": "0134894229", "password": "zahra4229", "email": "zahra.4229@students.pppl.id"}, {"no": 54, "nama": "ZAKIYA RAMADHANI ANDRIAN", "kelas": "6 B", "nisn": "0139157443", "password": "zakiya7443", "email": "zakiya.7443@students.pppl.id"}, {"no": 55, "nama": "ADELWEISS ATALA NETAYA", "kelas": "6 C", "nisn": "0136419592", "password": "adelweiss9592", "email": "adelweiss.9592@students.pppl.id"}, {"no": 56, "nama": "AHMAD FAIZ RAMADHAN", "kelas": "6 C", "nisn": "0136544741", "password": "ahmad4741", "email": "ahmad.4741@students.pppl.id"}, {"no": 57, "nama": "AIRLANGGA PUTRA PANGESTU", "kelas": "6 C", "nisn": "3131777498", "password": "airlangga7498", "email": "airlangga.7498@students.pppl.id"}, {"no": 58, "nama": "Alexandrie Zahira Maheswari", "kelas": "6 C", "nisn": "0136083727", "password": "alexandrie3727", "email": "alexandrie.3727@students.pppl.id"}, {"no": 59, "nama": "Altaf Nur Rizky", "kelas": "6 C", "nisn": "0133331017", "password": "altaf1017", "email": "altaf.1017@students.pppl.id"}, {"no": 60, "nama": "Arya Sena Anteri Yonti", "kelas": "6 C", "nisn": "0133922498", "password": "arya2498", "email": "arya.2498@students.pppl.id"}, {"no": 61, "nama": "Brilian Bilqist", "kelas": "6 C", "nisn": "3132941699", "password": "brilian1699", "email": "brilian.1699@students.pppl.id"}, {"no": 62, "nama": "Celvin Leonardo Christianus Takene", "kelas": "6 C", "nisn": "3135158701", "password": "celvin8701", "email": "celvin.8701@students.pppl.id"}, {"no": 63, "nama": "DANANG SATYO NUGROHO", "kelas": "6 C", "nisn": "0137245288", "password": "danang5288", "email": "danang.5288@students.pppl.id"}, {"no": 64, "nama": "Fajar Septian Nugraha", "kelas": "6 C", "nisn": "0136133466", "password": "fajar3466", "email": "fajar.3466@students.pppl.id"}, {"no": 65, "nama": "Farras Luthfi Josuan", "kelas": "6 C", "nisn": "0139256212", "password": "farras6212", "email": "farras.6212@students.pppl.id"}, {"no": 66, "nama": "Hafidz Daffa Arkana", "kelas": "6 C", "nisn": "0137960457", "password": "hafidz0457", "email": "hafidz.0457@students.pppl.id"}, {"no": 67, "nama": "Hafiza Khaira Lubna", "kelas": "6 C", "nisn": "3133008292", "password": "hafiza8292", "email": "hafiza.8292@students.pppl.id"}, {"no": 68, "nama": "Khanza Aisyah Putri Sobke", "kelas": "6 C", "nisn": "0131083389", "password": "khanza3389", "email": "khanza.3389@students.pppl.id"}, {"no": 69, "nama": "Khinara Azka Sabela", "kelas": "6 C", "nisn": "3130521997", "password": "khinara1997", "email": "khinara.1997@students.pppl.id"}, {"no": 70, "nama": "KHONSA SYAUQIYYAH WIBOWO", "kelas": "6 C", "nisn": "0132584693", "password": "khonsa4693", "email": "khonsa.4693@students.pppl.id"}, {"no": 71, "nama": "Lestari Anastasya Putri", "kelas": "6 C", "nisn": "3148769390", "password": "lestari9390", "email": "lestari.9390@students.pppl.id"}, {"no": 72, "nama": "Muhammad Syailendra Putra Kurniawan", "kelas": "6 C", "nisn": "3131217013", "password": "muhammad7013", "email": "muhammad.7013@students.pppl.id"}, {"no": 73, "nama": "Nadia Reisya Almira", "kelas": "6 C", "nisn": "0138811030", "password": "nadia1030", "email": "nadia.1030@students.pppl.id"}, {"no": 74, "nama": "Nafisah Nur Aliyyah Telaumbanua", "kelas": "6 C", "nisn": "3136119095", "password": "nafisah9095", "email": "nafisah.9095@students.pppl.id"}, {"no": 75, "nama": "NAURA RANIA FAJRIA DHOHIR", "kelas": "6 C", "nisn": "0144037882", "password": "naura7882", "email": "naura.7882@students.pppl.id"}, {"no": 76, "nama": "Ni Kadek Pande Ira Asmitarati", "kelas": "6 C", "nisn": "0134613821", "password": "ni3821", "email": "ni.3821@students.pppl.id"}, {"no": 77, "nama": "NOVAL SOFYANITA ARYA", "kelas": "6 C", "nisn": "0121479016", "password": "noval9016", "email": "noval.9016@students.pppl.id"}, {"no": 78, "nama": "Nurdafa Ilham Pratama", "kelas": "6 C", "nisn": "0139748445", "password": "nurdafa8445", "email": "nurdafa.8445@students.pppl.id"}, {"no": 79, "nama": "Sakha Arkan Maulana Subrata", "kelas": "6 C", "nisn": "0138803076", "password": "sakha3076", "email": "sakha.3076@students.pppl.id"}, {"no": 80, "nama": "Syauqinara Alesha Ramadhani", "kelas": "6 C", "nisn": "0133753282", "password": "syauqinara3282", "email": "syauqinara.3282@students.pppl.id"}, {"no": 81, "nama": "Talysa Dina Alvira", "kelas": "6 C", "nisn": "3130092923", "password": "talysa2923", "email": "talysa.2923@students.pppl.id"}, {"no": 82, "nama": "ADIBA KANZA KAMILA", "kelas": "6 D", "nisn": "0131981445", "password": "adiba1445", "email": "adiba.1445@students.pppl.id"}, {"no": 83, "nama": "Adika Zafran Alrazzaq", "kelas": "6 D", "nisn": "0147689076", "password": "adika9076", "email": "adika.9076@students.pppl.id"}, {"no": 84, "nama": "ALBIDZAR RAMDHAN FERDIANSYAH", "kelas": "6 D", "nisn": "3137026726", "password": "albidzar6726", "email": "albidzar.6726@students.pppl.id"}, {"no": 85, "nama": "ALIFFIYA ZALFA NABILA", "kelas": "6 D", "nisn": "0139885158", "password": "aliffiya5158", "email": "aliffiya.5158@students.pppl.id"}, {"no": 86, "nama": "ALISHA PUTRI JASMINE", "kelas": "6 D", "nisn": "3138969872", "password": "alisha9872", "email": "alisha.9872@students.pppl.id"}, {"no": 87, "nama": "Almeyda Qayyima Raida", "kelas": "6 D", "nisn": "0137707445", "password": "almeyda7445", "email": "almeyda.7445@students.pppl.id"}, {"no": 88, "nama": "Arva Zulham Safi'i", "kelas": "6 D", "nisn": "3146124095", "password": "arva4095", "email": "arva.4095@students.pppl.id"}, {"no": 89, "nama": "Azkia Al'Latifah", "kelas": "6 D", "nisn": "3138756924", "password": "azkia6924", "email": "azkia.6924@students.pppl.id"}, {"no": 90, "nama": "Azura Nathania Disdry", "kelas": "6 D", "nisn": "0139416516", "password": "azura6516", "email": "azura.6516@students.pppl.id"}, {"no": 91, "nama": "Azza Lova Qirani", "kelas": "6 D", "nisn": "0133944509", "password": "azza4509", "email": "azza.4509@students.pppl.id"}, {"no": 92, "nama": "Bima Prawira Putra Tanjung", "kelas": "6 D", "nisn": "3133176421", "password": "bima6421", "email": "bima.6421@students.pppl.id"}, {"no": 93, "nama": "Boby Aritana Bangngu", "kelas": "6 D", "nisn": "3135237543", "password": "boby7543", "email": "boby.7543@students.pppl.id"}, {"no": 94, "nama": "DANENDRA ANANDO SITONDA", "kelas": "6 D", "nisn": "0139411477", "password": "danendra1477", "email": "danendra.1477@students.pppl.id"}, {"no": 95, "nama": "DELIANA YOHANA BAWOLE", "kelas": "6 D", "nisn": "0146664720", "password": "deliana4720", "email": "deliana.4720@students.pppl.id"}, {"no": 96, "nama": "Dharma Yudha Prasetya", "kelas": "6 D", "nisn": "0139899463", "password": "dharma9463", "email": "dharma.9463@students.pppl.id"}, {"no": 97, "nama": "Glorya Anastacia Neno", "kelas": "6 D", "nisn": "0136603485", "password": "glorya3485", "email": "glorya.3485@students.pppl.id"}, {"no": 98, "nama": "Kenzo Yassaar Rahman", "kelas": "6 D", "nisn": "3142680300", "password": "kenzo0300", "email": "kenzo.0300@students.pppl.id"}, {"no": 99, "nama": "M. Akbar Nurdhafa Pratama", "kelas": "6 D", "nisn": "0136583540", "password": "m.3540", "email": "m.3540@students.pppl.id"}, {"no": 100, "nama": "Muhammad Davin Alkautsar", "kelas": "6 D", "nisn": "3132626497", "password": "muhammad6497", "email": "muhammad.6497@students.pppl.id"}, {"no": 101, "nama": "MUHAMMAD SYEHAN NOR AQSA PRATAMA", "kelas": "6 D", "nisn": "0133104666", "password": "muhammad4666", "email": "muhammad.4666@students.pppl.id"}, {"no": 102, "nama": "Naddira Putri Sayidina", "kelas": "6 D", "nisn": "3130159298", "password": "naddira9298", "email": "naddira.9298@students.pppl.id"}, {"no": 103, "nama": "Permata Nur Kalila Rifda Putri", "kelas": "6 D", "nisn": "0136646188", "password": "permata6188", "email": "permata.6188@students.pppl.id"}, {"no": 104, "nama": "Rafa Aditya Putra", "kelas": "6 D", "nisn": "3147826359", "password": "rafa6359", "email": "rafa.6359@students.pppl.id"}, {"no": 105, "nama": "VANEZA QUEENA BHAYANGKARA", "kelas": "6 D", "nisn": "0139723970", "password": "vaneza3970", "email": "vaneza.3970@students.pppl.id"}, {"no": 106, "nama": "Velia Wafa Nasuhi", "kelas": "6 D", "nisn": "0138598583", "password": "velia8583", "email": "velia.8583@students.pppl.id"}];

async function clearExistingData() {
  try {
    console.log('\n=== CLEARING EXISTING DATA ===');
    
    // Delete all students from users collection
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    console.log(`Found ${studentsSnapshot.size} existing students`);
    
    let deletedCount = 0;
    for (const doc of studentsSnapshot.docs) {
      const studentData = doc.data();
      
      // Delete from Firebase Auth if email exists
      if (studentData.email) {
        try {
          await auth.deleteUser(doc.id);
          console.log(`Deleted auth user: ${studentData.email}`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            console.log(`Auth user not found for: ${studentData.email}`);
          } else {
            console.error(`Error deleting auth user ${studentData.email}:`, error.message);
          }
        }
      }
      
      // Delete from Firestore
      await db.collection('users').doc(doc.id).delete();
      deletedCount++;
      console.log(`Deleted student: ${studentData.name} (${studentData.nisn})`);
    }
    
    console.log(`\nSuccessfully deleted ${deletedCount} students`);
    
  } catch (error) {
    console.error('Error clearing existing data:', error);
    throw error;
  }
}

async function createStudents() {
  try {
    console.log('\n=== CREATING NEW STUDENTS ===');
    
    for (const student of studentsData) {
      try {
        // Create auth user
        const userRecord = await auth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.nama,
          emailVerified: false,
        });
        
        console.log(`Created auth user: ${student.email} (UID: ${userRecord.uid})`);
        
        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          name: student.nama,
          email: student.email,
          nisn: student.nisn,
          class: student.kelas,
          role: 'student',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`✓ Student created: ${student.nama} - NISN: ${student.nisn}`);
        console.log(`  Email: ${student.email}`);
        console.log(`  Password: ${student.password}`);
        console.log(`  Kelas: ${student.kelas}`);
        
      } catch (error) {
        console.error(`✗ Error creating student ${student.nama}:`, error.message);
      }
    }
    
    console.log('\n=== STUDENT CREATION COMPLETED ===');
    
  } catch (error) {
    console.error('Error creating students:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting student data migration...');
    console.log(`Total students to process: ${studentsData.length}`);
    
    await clearExistingData();
    await createStudents();
    
    console.log('\n✓ All operations completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Script failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
