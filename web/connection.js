// mongodb+srv://manav:<password>@packwireapp.03z5b.mongodb.net/?retryWrites=true&w=majority&appName=packwireApp


import mongoose from 'mongoose';

const connection = mongoose.connect('mongodb+srv://manav:manav@packwireapp.03z5b.mongodb.net/boxcollections?retryWrites=true&w=majority&appName=packwireApp')

export default connection;