var express = require('express');
var router = express.Router();
const app = express();
const session = require('express-session');
const {apps, auth, db } = require('./models/firebase.js');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, setDoc,getDocs, doc, query, where } = require('firebase/firestore');

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    return next();
  } else {
    return res.redirect('/login');
  }
};





/* GET home page. */
router.get('/', function (req, res, next) {  
  const successMessage = req.session.successMessage;
  req.session.successMessage = null; // Clear after displaying
  res.render('index', { successMessage, user: req.session.user });
  
});

router.get('/resources', (req, res, next) => {
  const user = auth.currentUser;
  res.render('resource',{error:"", user});
});

router.get('/report',ensureAuthenticated, (req, res, next) => {
  res.render('report',{error:""});
});
router.get('/login', (req, res, next) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null; // Clear after displaying
  res.render('login', { error: "", successMessage });
});

router.get('/register', (req, res, next) => {
  res.render('register',{error:""});
});

router.post('/signup', async (req, res) => {
  const { email, password, confirm_password, firstName, lastName, phone } = req.body;

  try {
    // Validate input fields
    if (!email || !password || !confirm_password || !firstName || !lastName || !phone) {
      return res.render("register", { error: "All fields are required" });
    }

    // Check if passwords match
    if (password !== confirm_password) {
      return res.render("register", { error: "Passwords do not match" });
    }

    // Create a new user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store additional user data in Firestore
    const userRef = doc(db, 'users', user.uid); // Set the document ID to the user's UID
    await setDoc(userRef, {
      email: user.email,
      firstName,
      lastName,
      phone,
      createdAt: new Date(),
    });
    req.session.successMessage = "Account Created Successfully";
    return res.redirect('/login');
  } catch (error) {
    // Handle Firebase-specific errors
    if (error.code === 'auth/email-already-in-use') {
      return res.render("register", { error: "This email is already in use" });
    } else if (error.code === 'auth/weak-password') {
      return res.render("register", { error: "Password should be at least 6 characters" });
    } else if (error.code === 'auth/invalid-email') {
      return res.render("register", { error: "Invalid email format" });
    }

    // Log unexpected errors for debugging
    console.error("Unexpected error during signup:", error);

    // Render a generic error message for other errors
    res.render("register", { error: "Please check network and  try again later." });
  }
});
 

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.render('login', { error: 'Email and password are required.' });
    }

    // Authenticate user with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user data from Firestore
    const q = query(collection(db, 'users'), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.render('login', { error: 'User not found in database.' });
    }

    // Extract user data
    const userData = querySnapshot.docs[0].data();
    res.locals.user = {
      id: user.uid,
      name: `${userData.firstName} ${userData.lastName}`,
      email: user.email,
    };

    console.log('User Logged In:', res.locals.user);

    // Save user session
    req.session.user = res.locals.user;
    req.session.successMessage = "Login successful! Welcome back.";

    return res.redirect('/');
  } catch (error) {
    console.error('Authentication Error:', error.message);

    // Handle Firebase authentication errors
    if (error.code === 'auth/user-not-found') {
      return res.render('login', { error: 'No account found with this email.' });
    } else if (error.code === 'auth/wrong-password') {
      return res.render('login', { error: 'Incorrect password. Please try again.' });
    } else if (error.code === 'auth/invalid-email') {
      return res.render('login', { error: 'Invalid email format.' });
    } else {
      return res.render('login', { error: 'An unexpected error occurred. Please try again.' });
    }
  }

});

router.post('/submit-report', async (req, res) => {
  const {title, description, location, dateOfIncident, incidentType} = req.body;
  try {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      console.log(userId);
      // Get the user ID

      // Create a new report in Firestore under the user's ID
      await addDoc(collection(db, 'reports', userId, 'userReports'), {
        title: title,
        description: description,
        location: location,
        dateOfIncident: dateOfIncident,
        incidentType: incidentType,
        isPending: false,
        // Save the date of the incident
        timestamp: new Date(),
      });      
      req.session.successMessage = "Report submitted successfully!";
      return res.redirect('/view-reports');
    } else {
      res.redirect("/login")
    }
  } catch (error) {
    res.render("report",{error:"Check network and try again"})
  }

})

router.get('/view-reports', ensureAuthenticated, async (req, res, next) => {
  const userId = auth.currentUser.uid;
  let reports = []; // Initialize reports to an empty array

  try {
    const userReportsRef = collection(db, "reports", userId, "userReports");
    const userReportsSnap = await getDocs(userReportsRef);

    if (!userReportsSnap.empty) {
      reports = userReportsSnap.docs.map((doc) => ({
        id: doc.id, // Report ID
        ...doc.data(), // Report data
      }));
      console.log(reports); // Log the reports for debugging
    } else {
      console.log('No reports found for this user.');
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
  }

  // Render the view and pass the reports (empty if none found)
  
  const successMessage = req.session.successMessage;
  req.session.successMessage = null; // Clear after displaying

  res.render('view-reports', { successMessage, error: "", reports });
});


module.exports = router;
