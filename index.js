const express= require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
app.use(express.json());

const mysql = require("mysql");
app.use(bodyParser.json());
app.use(cors())
const con= mysql.createConnection({
    host:'nodedatabase.c1scey2w2zg8.us-east-1.rds.amazonaws.com',
    user:"admin",
    password:"Mk@shubham@in#111",
    database:"suhani_dating"
});
con.connect((err)=>{
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports =con;
app.use(express.json());


app.get("/",(req,resp)=>{
    con.query("select * from user_table",(err,result)=>{
        if(err)
        {
            resp.send("error")
        }
        else{
            resp.send("resultone")
        }
       })
});
/////////////////////////////////////////


app.put('/api/user/change-password/:id', (req, res) => {
  const { id } = req.params;
  const { password, new_password } = req.body;

  // Check old password and update if it matches
  const query = 'UPDATE user_table SET password = ? WHERE id = ? AND password = ?';
  
  con.query(query, [new_password, id, password], (error, results) => {
      if (error) {
          console.error(error);
          return res.status(500).json({"status":false, message: 'Error updating password' });
      }

      if (results.affectedRows === 0) {
          return res.status(200).json({"status":false, message: 'Invalid credentials' });
      }

      return res.json({"status":true, message: 'Password changed successfully' });
  });
});
//////////////////////////////


const jwt = require('jsonwebtoken');

app.post('/api/user/login', async (req, resp) => {
  const { email, password } = req.body;

  if ( email === undefined ||
    email.length === 0 ||
    password === undefined ||
    password.length === 0
  ) {
    return resp.status(200).send({
      status: 'FAIL',
      message: 'Please enter required fields!'
    });
  }

  // Check if the user exists with the given email
  con.query('SELECT * FROM user_table WHERE email = ?', [email], (selectErr, selectResults) => {
    if (selectErr) {
      return resp.status(500).send({
        status: false,
        message: 'Error querying database'
      });
    }

    if (selectResults.length > 0) {
      const user = selectResults[0];

      // Check if the password is correct
      if (password === user.password) {
        // Password is correct, generate token and return user data
        const token = jwt.sign({ email: email }, 'your-secret-key', { expiresIn: '1h' });
        resp.send({
          status: true,
          message: 'Operation Successful',
          token: token,
          user_id: user.id
        });
      } else { // Password is incorrect, return an error response
        return resp.status(200).send({
          status: false,
          message: 'Incorrect password',
          token: "",
          user_id: 0
        });
      }
    } else {
      // User does not exist, return an error response
      return resp.status(200).send({
        status: false,
        message: 'User not found',
        token: "",
        user_id: 0
      });
    }
  });
});



/////////////////////////////////////////////////////
app.get('/total_users', (req, res) => {
  const querydata = req.query.macAddress;

  const query = 'SELECT COUNT(*) AS userCount FROM user_table';
  
  con.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.send({
        status: false,
        message: err.message,
      });
    } else { const userCount = results[0].userCount;
      res.send({
        status: true,
        message: 'Data matched',
        data: userCount,
      });
    }
  });
});
/////////////////
app.get('/api/totaluser', (req, res) => {
  // Set headers

  const selectQuery = 'SELECT * FROM user_table';
  con.query(selectQuery, (err, results) => {
      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.status(200).json({"status": true, "results":results});
      }
  });
});


///////////////////////////////////////////////////account detail ///
const Query = 'SELECT * FROM user_table WHERE id = ?';

app.get('/api/account-details/:id', (req, res) => {
  try {
    // Assuming the user ID is passed as a route parameter
    const id = req.params.id;

    // Execute SQL query
    con.query(Query, [id], (error, results) => {
      if (error) {
        throw error;
      }

      // Check if the user profile exists
      if (results.length > 0) {
        const user = results[0];

        // Transform the database result to match the structure of your sampleProfile
        const userProfile = {
          profile_id:user.profile_id,
           name:user.name,
            email: user.email,
           password: user.password,
           mobile_number:user.mobile_number,
           city_id_FK: user.city_id_FK,
           state_id_FK: user.state_id_FK,
           country_id_FK: user.country_id_FK ,
          };

        const response = {
          status: true,
          message: 'User profile retrieved successfully',
 account_detail: userProfile,
        };

        res.json(response);
      } else {
        // User not found
        const notFoundResponse = {
          status: 'error',
          message: 'User not found',
          profileList: [],
        };
        res.status(200).json(notFoundResponse);
      }
    });
  } catch (error) {
    const errorResponse = {
      status: 'error',
      message: `Error retrieving user profile: ${error.message}`,
      profileList: [],
    };
    res.status(500).json(errorResponse);
  }
});
////////////////////////////////////////////
////////////////////////////////////////////////////////
app.post('/api/user/feedback', async (req, res) => {
  const { name, email, message, rating } = req.body;

  try {
    await con.query('INSERT INTO feedback (name, email, message, rating) VALUES (?, ?, ?, ?)', [name, email, message, rating]);


    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error in feedback submission:', error); res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/rateus', async (req, res) => {
  const { rating } = req.body;

  try {

    await con.query('INSERT INTO feedback (rating) VALUES (?)', [rating]);


    res.status(200).json({ message: 'Rating submitted successfully'});
  } catch (error) {
    console.error('Error in rating submission:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
///////////////////////////////////////////////////

 
//////////////////////////////
app.post('/swipe-right', (req, res) => {
  const { user_id, other_user_id } = req.body;

  const query = 'INSERT INTO swipes (user_id, other_user_id, action) VALUES (?, ?, "right")';
  con.query(query, [user_id, other_user_id], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json({ success: true, message: 'Swipe right action recorded successfully.' });
  });    res.json({ success: true, message: 'Swipe right action recorded successfully.' });
  });

//////////////////////////////////////////////////////////
app.post('/swipe-left', (req, res) => {
  const { user_id, other_user_id } = req.body;

  const query = 'INSERT INTO swipes (user_id, other_user_id, action) VALUES (?, ?, "left")';
  con.query(query, [user_id, other_user_id], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json({ success: true, message: 'Swipe left action recorded successfully.' });
  });
});
//////////////////////////////


  ////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////
app.put('/update/name/:id', (req, res) => {
  const data = [
    req.body.name,
    req.params.id,
  ];

  con.query(
    'UPDATE user_table SET name = ? WHERE id = ?',
    data,
    (err, result) => {
      if (err) {
        console.error('Error updating record: ' + err.message);
        res.status(500).send('Error updating record');
      } else {
        res.send('Record updated successfully');
      }
    }
  );
});
/////////////////////////////////////////////////////////////////////
app.get('/api/education', (req, res) => {
  const query = 'SELECT * FROM user_table';
  con.query(query, (error, results) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;    }
    res.json(results);
  });
});
////////////////

app.get('/plan/api2', (req, res) => {
  const query = 'SELECT id, title, subtitle, discount, plan_of_plize, off_prize FROM tbl_plan';
  con.query(query, (error, results) => {
    if (error) throw error;
    res.json({ success: true, results });
  });
});

/////////////////////////////////



// ////////////////


//////////////////////////////////////////////MATCHES

/////////////////////////////////////     MY PROFILE
const profilequery = 'SELECT * FROM user_table WHERE id = ?';

app.get('/api/user/profile/:id', (req, res) => {
  try {
    // Assuming the user ID is passed as a route parameter
    const id = req.params.id;

    // Execute SQL query
    con.query(profilequery, [id], (error, results) => {
      if (error) {
        throw error;
      }

      // Check if the user profile exists
      if (results.length > 0) {
        const user = results[0];

        // Transform the database result to match the structure of your sampleProfile
        const userProfile = {  profile_id: user.profile_id,
          name:user.name,
           age:user.age,
           gender: user.gender,
           relationship_goals:user.relationship_goals,
           marital_status: user.marital_status,
           ideal_match:user.ideal_match,
completion_rate:"70",

           bio:user.first_impression,
          city_id_FK:user.city_id_FK,
          country_id_FK: user.country_id_FK,
          state_id_FK: user.state_id_FK,
           occupation: user.occupation,
           date_of_birth: user.date_of_birth,
            religion_id_FK:user.religion_id_FK,
            personality_description:user.description,
            having_children: user.having_children,
            having_pets: user.having_pets,
            gender: user.gender,
          education:user.education,
          career:user.career,
            language: user.language,
            personality_id_FK:user.personality_id_FK,
            hobbies:user.hobbies,
            do_you_smoke:user.do_you_smoke,
              alcohal_consumption:user.alcohol_consumption,
              drug_use:user.drug_use,
              diet_like:user.diet_like,
              what_do_you_prefer: user.what_do_you_prefer,
              which_one_are_you:user.which_one_are_you,
              fitness_activeness: user.fitness_activeness,
              brew_prefence: user.brew_prefence,
              person_type:user.person_type,
              fitness_activeness: user.fitness_activeness,  gallery: user.gallery,


             gallery:[
              'https://suhani-api.s3.ap-south-1.amazonaws.com/img3.jpg',
              'https://suhani-api.s3.ap-south-1.amazonaws.com/img3.jpg', 
              'https://suhani-api.s3.ap-south-1.amazonaws.com/img3.jpg',
              'https://suhani-api.s3.ap-south-1.amazonaws.com/img3.jpg',
            ]

          };

        const response = {
          status: true,
          message: 'User profile retrieved successfully',
          profiledata: userProfile,
        };

        res.json(response);
      } else {
        // User not found
        const notFoundResponse = {
          status: false,
          message: 'User not found',
          profiledata: {},
        };
        res.status(200).json(notFoundResponse);
      }
    });
  } catch (error) {
    const errorResponse = {
      status: 'error',
      message: `Error retrieving user profile: ${error.message}`,
      profileList: [],
    };  res.status(500).json(errorResponse);
  }
});
///////////////////////////////////////////blocked profile   //////////////////


///////////////////////////////////////////////////////////////////


///////////////////////////////////////////blocked profile   //////////////////
app.get('/api/test', (req, res) => {
  try{
    res.json({ success: true });
   } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
  
});
///////////////////////////////
app.get('/api/countries/:country_id', (req, res) => {
  const country_id_PK = req.params.country_id;

  const selectQuery = 'SELECT * FROM `tbl_country` WHERE country_id_PK=?';
  console.log('result ' + country_id_PK);
  con.query(selectQuery,[country_id_PK], (err, results) => {
    console.log('result ' + results);
    console.log('err ' + err);

      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
         if(results.length === 0){
          res.status(200).json("Country Not Found"); }else{
          res.status(200).json(results);
         }
      }
  });
});
////////////////////////////////////
app.get('/api/state1/:state_id', (req, res) => {
  const state_id_PK = req.params.state_id;

  const selectQuery = 'SELECT * FROM `tbl_state` WHERE state_id_PK=?';
  con.query(selectQuery,[state_id_PK], (err, results) => {
    console.log('result ' + results);
    console.log('err ' + err);

      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
         if(results.length === 0){
          res.status(200).json("state Not Found");
         }else{
          res.status(200).json(results);
         }
      }
  });
});

////////////////////////////////////////////

app.get('/api/city/:city_id', (req, res) => {
  const city_id_PK = req.params.city_id;

  const selectQuery = 'SELECT * FROM `tbl_city` WHERE city_id_PK=?';
  con.query(selectQuery,[city_id_PK], (err, results) => {
    console.log('result ' + results);
    console.log('err ' + err);

      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
         if(results.length === 0){
          res.status(200).json("city Not Found");
         }else{
          res.status(200).json(results);
         }
      }
  });
});
//////////////////////////
app.get('/api/city', (req, res) => {
  const selectQuery = 'SELECT * FROM tbl_city';
  con.query(selectQuery, (err, results) => {
      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.status(200).json(results);
      }
  });
});///////////////////////
app.get('/api/country', (req, res) => {
  const selectQuery = 'SELECT * FROM tbl_country';
  con.query(selectQuery, (err, results) => {
      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.status(200).json({"status": true, "results":results});
      }
  });
});
///////////////////////////////////////////////////////////////////
app.get('/api/state/:country_id', (req, res) => {
  const country_id_PK = req.params.country_id;

  const selectQuery = 'SELECT c.*, s.* FROM tbl_country c LEFT JOIN tbl_state s ON c.country_id_PK = s.country_id_FK WHERE c.country_id_PK = ?';

  con.query(selectQuery, [country_id_PK], (err, results) => {
    if (err) {
      console.error('Error executing select query: ' + err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('result', results);

      if (results.length === 0) {
        res.status(200).json("Country Not Found");
      } else {
        const states = results.map(result => ({
          state_id: result.state_id, 
          state_name: result.state_name 
        }));

        res.status(200).json({"status": true, "results":results});
      }
    }  });
});
//////////////////////////////

app.get('/api/cities/:state_id', (req, res) => {
  const state_id = req.params.state_id;

  const selectCitiesQuery = 'SELECT * FROM tbl_city WHERE state_id_FK = ?';

  con.query(selectCitiesQuery, [state_id], (err, results) => {
    if (err) {
      console.error('Error executing select query: ' + err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({"status": true, "results":results});
    }
  });
});
/////////////////////
app.get('/api/user/personality', (req, res) => {
  const selectQuery = 'SELECT * FROM tbl_personality';
  con.query(selectQuery, (err, results) => {
      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.status(200).json({"status": true, "results":results});
      }
  });
});
////////////////////////
const sampleProfileQuery = 'SELECT * FROM user_table WHERE id = ?';

app.get('/intresst_detail/api/:id', (req, res) => {
  try {// Assuming the user ID is passed as a route parameter
    const id = req.params.id;

    // Execute SQL query
    con.query(sampleProfileQuery, [id], (error, results) => {
      if (error) {
        throw error;
      }

      // Check if the user profile exists
      if (results.length > 0) {
        const user = results[0];

        // Transform the database result to match the structure of your sampleProfile
        const userProfile = {

          marital_status: user.marital_status,
          // gallery: user.gallery,
          image: user.image, 
          city:user.city,
          country: user.country,
          state: user.state,
           name:user.name,
            email: user.email,
            marital_status: user.marital_status,
            religion:user.religion ,
            date_of_birth:user.date_of_birth,
            relationship_goals:user.relationship_goals,
            ideal_match:user.ideal_match,
            having_children: user.having_children,
            having_pets: user.having_pets,
            gender: user.gender,
          education:user.education,
          career:user.career,
            language: user.language,
            personality_id_FK:user.personality_id_FK,
 hobbies:user.hobbies,
            do_you_smoke:user.do_you_smoke,
              alcohal_consumption:user.alcohol_consumption,
              drug_use:user.drug_use,
              diet_like:user.diet_like,
              what_do_you_prefer: user.what_do_you_prefer,
              which_one_are_you:user.which_one_are_you,
              fitness_activeness: user.fitness_activeness,
              brew_prefence: user.brew_prefence,
              person_type:user.person_type,
              fitness_activeness: user.fitness_activeness,
              gallery: user.gallery,


            gallery:'https://suhani-api.s3.ap-south-1.amazonaws.com/img3.jpg',

          };

        const response = {
          status: true,
          message: 'User profile retrieved successfully',
          profileList: userProfile,
        };

        res.json(response);
      } else {
        // User not found
        const notFoundResponse = {
          status: 'error',
          message: 'User not found',
          profileList: [],
        };
        res.status(200).json(notFoundResponse);
      }
    });  } catch (error) {
    const errorResponse = {
      status: 'error',
      message: `Error retrieving user profile: ${error.message}`,
      profileList: [],
    };
    res.status(500).json(errorResponse);
  }
});
/////////////////////////
app.delete('/api/delete/userprofile/:id', (req, res) => {
  const userId = req.params.id;

  const checkUserQuery = 'SELECT * FROM user_table WHERE id = ?';
  con.query(checkUserQuery, [userId], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error checking user:', checkErr);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (checkResult.length === 0) {

      res.status(404).json({ status: false, message: 'User not found' });
      return;
    }

   
    const deleteQuery = 'DELETE FROM user_table WHERE id = ?';
    con.query(deleteQuery, [userId], (err, result) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('User deleted successfully');   res.status(200).json({ status: true, message: 'User deleted successfully' });
      }
    });
  });
});
////////////////////
app.get('/api/user/religion', (req, res) => {
  const selectQuery = 'SELECT * FROM tbl_religion';
  con.query(selectQuery, (err, results) => {
      if (err) {
          console.error('Error executing select query: ' + err.message);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.status(200).json({"status": true, "results":results});
      }
  });
});
////////////////////
 app.get('/api/user/education', (req, res) => {

    const selectQuery = 'SELECT * FROM tbl_education';
    
    con.query(selectQuery, (err, results) => {
        if (err) {
            console.error('Error executing select query: ' + err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({"status": true, "results":results});
        }
    });
  });
  
  
  
///////////////

/////////////////////////
app.put('/api/user/lifestyle/:id', (req, res) => {
  const data = [
    req.body.do_you_smoke,
    req.body.alchol_consumption,
    req.body.drug_use,
    req.body.diet_like,
    req.body.brew_prefence,
    req.body.person_type,
    req.body.fitness_activeness,
    req.body.favourite_type_of_food,
    req.params.id,
  ];
  con.query(
    'UPDATE user_table SET do_you_smoke = ?, alchol_consumption = ?, drug_use = ?, diet_like = ?, brew_prefence = ?, person_type = ?, fitness_activeness = ?, favourite_type_of_food = ? WHERE id = ?',
    data,
    (err, updateResult) => {
      if (err) {
        console.error('Error updating record:', err.message);
        res.status(500).send('Error updating record');
      } else {
        res.json({
          success: true,
          message: 'Record updated successfully',
        });
      }
    }
  );
});
////////////////////////
app.put('/api/user/hobbies/:id', (req, res) => {
  const data = [
    req.body.hobbies,

    req.params.id,
  ];

  con.query(
    'UPDATE user_table SET hobbies = ? WHERE id = ?',
    data,
    (err, updateResult) => {
      if (err) {
        console.error('Error updating record:', err.message);
        res.status(500).send('Error updating record');
      } else {
        res.json({
          success: true, message: 'Record updated successfully',
        });
      }
    }
  );
});
/////////////////////
app.put('/api/user/personality/:id', (req, res) => {
  const data = [
    req.body.personality,
    req.body.personality_id_FK,
    req.params.id,
  ];

  con.query(
    'UPDATE user_table SET personality = ?, personality_id_FK = ? WHERE id = ?',
    data,
    (err, updateResult) => {
      if (err) {
        console.error('Error updating record:', err.message);
        res.status(500).send('Error updating record');
      } else {
        res.json({
          success: true,
          message: 'Record updated successfully',
        });
      }
    }
  );
});
/////////////////////
app.put('/api/user/profiledetail/:id', (req, res) => {
  const data = [
    req.body.email,
    req.body.mobile_number,
    req.body.date_of_birth,
 req.body.country_id_FK,
    req.body.state_id_FK,
    req.body.city_id_FK,
    req.body.zip_code,
    req.params.id,
  ];

  con.query(
    'UPDATE user_table SET email = ?, mobile_number = ?, date_of_birth = ?, country_id_FK = ?, state_id_FK = ?, city_id_FK = ?, zip_code = ?  WHERE id = ?',
    data,
    (err, updateResult) => {
      if (err) {
        console.error('Error updating record:', err.message);
        res.status(500).send('Error updating record');
      } else {
        res.json({
          success: true,
          message: 'Record updated successfully',
        });
      }
    }
  );
});
/////////////////
app.put('/api/user/personaldetail/:id', (req, res) => {
  const data = [
    req.body.relationship_goals,
    req.body.ideal_match,
    req.body.marital_status, req.body.marital_status,
    req.body.having_children,
    req.body.having_pets,
    req.body.religion_id_FK,
    req.body.language,
    req.params.id,
  ];

  con.query(
    'UPDATE user_table SET relationship_goals = ?, ideal_match = ?, marital_status = ?, having_children = ?, having_pets = ?, religion_id_FK = ?, language = ?  WHERE id = ?',
    data,
    (err, updateResult) => {
      if (err) {
        console.error('Error updating record:', err.message);
        res.status(500).send('Error updating record');
      } else {
        res.json({
          success: true,
          message: 'Record updated successfully',
        });
      }
    }
  );
});
/////////////////
app.put('/api/user/education/:id', (req, res) => {
  const data = [
    req.body.occupation,
    req.body.education_id_FK,
   
    req.params.id,
  ];

  con.query(
    'UPDATE user_table SET occupation = ?, education_id_FK = ?  WHERE id = ?',
    data, (err, updateResult) => {
      if (err) {
        console.error('Error updating record:', err.message);
        res.status(500).send('Error updating record');
      } else {
        res.json({
          success: true,
          message: 'Record updated successfully',
        });
      }
    }
  );
});
//////////////////
app.put('/api/user/bio/:id', (req, res) => {
  const data = [
    req.body.first_impression,

    req.params.id,
  ];

  con.query(
    'UPDATE user_table SET first_impression = ? WHERE id = ?',
    data,
    (err, updateResult) => {
      if (err) {
        console.error('Error updating record:', err.message);
        res.status(500).send('Error updating record');
      } else {
        res.json({
          success: true,
          message: 'Record updated successfully',
        });
 }
    }
  );
});


///////////////////////
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  const selectQuery = 'SELECT * FROM user_table WHERE id = ?';

  con.query(selectQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error executing select query: ' + err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length === 0) {
        res.status(404).json({ "status": false, "message": "User not found" });
      } else {
        res.status(200).json({ "status": true, "results": results });
      }
    }
  });
});
//////////////////////////
app.get('/api/services', async (req, resp) => {
  try {
    const { servicestype_id_FK } = req.query;

    let query = `
      SELECT s.*, u.name, u.photo
      FROM tbl_services s
      LEFT JOIN user_table u ON s.id_FK = u.id`;
  
    if (servicestype_id_FK !== undefined) { query += ' WHERE s.servicestype_id_FK = ?';

    }

    con.query(query, [servicestype_id_FK], (err, results) => {
      if (err) {
        console.error(err);
        return resp.status(500).send({
          status: false,
          message: 'Error retrieving data from the database',
          error: err.message
        });
      }

      const responseData = {};

      results.forEach(service => {
        const serviceType = service.servicestype_id_FK;
        if (!responseData[serviceType]) {
          responseData[serviceType] = [];
        }
        responseData[serviceType].push({
          service_id: service.service_id,
          user: {
            name: service.name,
            photo: service.photo,
            about_services: service.about_services,
            languages: service.languages,
            experience: service.experience,
            charges: service.charges

          }
        });
      });

      resp.send({
        status: true,
        message: 'Operation Successful',
        data: responseData
      });
    });
  } catch (error) {
    console.error('Error retrieving services:', error);
    resp.status(500).send({
      status: false,
      message: 'Internal Server Error'
    });
  }
});
/////////////////////

////////////////////////
app.post('/api/blocked-users', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      status: 'FAIL',
      message: 'Please enter required fields!',
    });
  }

  // Check if the user is already blocked
  const checkSql = 'SELECT * FROM user_table WHERE id = ? AND email = true';

  con.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error executing check query: ' + checkErr.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
if (checkResult.length > 0) {
      return res.status(200).json({
        success: false,
        msg: 'User is already blocked',
      });
    }

    // Block the user if not already blocked
    const blockSql = 'UPDATE user_table SET email = true WHERE id = ?';

    con.query(blockSql, [id], (err, result) => {
      if (err) {
        console.error('Error executing block query: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          msg: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        msg: 'Blocked user',
      });
    });
  });
});
////////////////////
app.post('/api/unblock-users', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      status: 'FAIL',
      message: 'Please enter required fields!',
    });
  }

  const sql = 'UPDATE user_table SET email = false WHERE id = ?';

  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error executing query: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        msg: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      msg: 'Unblocked user',
    });
  });
});//////////////////////////
app.get('/api/blocked-users-list', (req, res) => {
  const sql = 'SELECT * FROM user_table WHERE email = true';

  con.query(sql, (err, blockedUsers) => {
    if (err) {
      console.error('Error executing query: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(200).json({
      success: true,
      blockedUsers: blockedUsers,
    });
  });
});
/////////////////////

////////////////////////////////
// app.listen(5002);
 app.listen(3001, function (err)
 {   if (err) console.log("Error in server setup")
  console.log("Server listening on Port", 3001);
});
