import { query } from '../config/database.js';

/**
 * Save or update user profile
 * PUT /api/profile
 * 
 * This endpoint is protected and requires authentication
 * 
 * Request body:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "dateOfBirth": "1990-01-15",
 *   "gender": "Male",
 *   "maritalStatus": "Married",
 *   "fatherName": "John Senior",
 *   "motherName": "Jane Doe",
 *   "email": "john.doe@example.com",
 *   "address": "123 Main St",
 *   "city": "Mumbai",
 *   "state": "Maharashtra",
 *   "zipcode": "400001",
 *   "residentialStatus": "Owned",
 *   "durationOfStayYears": 5,
 *   "durationOfStayMonths": 3,
 *   "numberOfDependents": 2,
 *   "educationalQualification": "Bachelor's Degree"
 * }
 */
export const saveProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId; // From JWT token (set by auth middleware)
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      maritalStatus,
      fatherName,
      motherName,
      email,
      address,
      city,
      state,
      country,
      zipcode,
      residentialStatus,
      durationOfStayYears,
      durationOfStayMonths,
      numberOfDependents,
      educationalQualification,
      avatar,
      isActive
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        error: 'First name and last name are required'
      });
    }

    // Validate date of birth format if provided
    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date of birth format. Use YYYY-MM-DD'
        });
      }
    }

    // Validate gender if provided
    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({
        error: 'Invalid gender. Must be one of: Male, Female, Other'
      });
    }

    // Validate marital status if provided
    if (maritalStatus && !['Single', 'Married', 'Divorced', 'Widowed'].includes(maritalStatus)) {
      return res.status(400).json({
        error: 'Invalid marital status. Must be one of: Single, Married, Divorced, Widowed'
      });
    }

    // Validate residential status if provided
    if (residentialStatus && !['Owned', 'Rental', 'Parental'].includes(residentialStatus)) {
      return res.status(400).json({
        error: 'Invalid residential status. Must be one of: Owned, Rental, Parental'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }
    }

    // Validate numeric fields
    if (durationOfStayYears !== undefined && (isNaN(durationOfStayYears) || durationOfStayYears < 0)) {
      return res.status(400).json({
        error: 'Duration of stay (years) must be a non-negative number'
      });
    }

    if (durationOfStayMonths !== undefined && (isNaN(durationOfStayMonths) || durationOfStayMonths < 0 || durationOfStayMonths > 11)) {
      return res.status(400).json({
        error: 'Duration of stay (months) must be a number between 0 and 11'
      });
    }

    if (numberOfDependents !== undefined && (isNaN(numberOfDependents) || numberOfDependents < 0)) {
      return res.status(400).json({
        error: 'Number of dependents must be a non-negative number'
      });
    }

    // Check if user exists
    const userCheck = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Prepare update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      updateValues.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      updateValues.push(lastName);
    }
    if (dateOfBirth !== undefined) {
      updateFields.push(`date_of_birth = $${paramCount++}`);
      updateValues.push(dateOfBirth);
    }
    if (address !== undefined) {
      updateFields.push(`address = $${paramCount++}`);
      updateValues.push(address);
    }
    if (city !== undefined) {
      updateFields.push(`city = $${paramCount++}`);
      updateValues.push(city);
    }
    if (state !== undefined) {
      updateFields.push(`state = $${paramCount++}`);
      updateValues.push(state);
    }
    if (country !== undefined) {
      updateFields.push(`country = $${paramCount++}`);
      updateValues.push(country);
    }
    if (zipcode !== undefined) {
      updateFields.push(`zipcode = $${paramCount++}`);
      updateValues.push(zipcode);
    }
    if (gender !== undefined) {
      updateFields.push(`gender = $${paramCount++}`);
      updateValues.push(gender);
    }
    if (maritalStatus !== undefined) {
      updateFields.push(`marital_status = $${paramCount++}`);
      updateValues.push(maritalStatus);
    }
    if (fatherName !== undefined) {
      updateFields.push(`father_name = $${paramCount++}`);
      updateValues.push(fatherName);
    }
    if (motherName !== undefined) {
      updateFields.push(`mother_name = $${paramCount++}`);
      updateValues.push(motherName);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(email);
    }
    if (residentialStatus !== undefined) {
      updateFields.push(`residential_status = $${paramCount++}`);
      updateValues.push(residentialStatus);
    }
    if (durationOfStayYears !== undefined) {
      updateFields.push(`duration_of_stay_years = $${paramCount++}`);
      updateValues.push(durationOfStayYears);
    }
    if (durationOfStayMonths !== undefined) {
      updateFields.push(`duration_of_stay_months = $${paramCount++}`);
      updateValues.push(durationOfStayMonths);
    }
    if (numberOfDependents !== undefined) {
      updateFields.push(`number_of_dependents = $${paramCount++}`);
      updateValues.push(numberOfDependents);
    }
    if (educationalQualification !== undefined) {
      updateFields.push(`educational_qualification = $${paramCount++}`);
      updateValues.push(educationalQualification);
    }
    if (avatar !== undefined) {
      updateFields.push(`avatar = $${paramCount++}`);
      updateValues.push(avatar);
    }
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      updateValues.push(isActive);
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No profile fields provided to update'
      });
    }

    // Set created_by on first update if not set
    const userData = await query(
      'SELECT created_by FROM users WHERE id = $1',
      [userId]
    );

    if (!userData.rows[0].created_by) {
      updateFields.push(`created_by = $${paramCount++}`);
      updateValues.push(userId);
    }

    // Always update updated_by and updated_at
    updateFields.push(`updated_by = $${paramCount++}`);
    updateValues.push(userId);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Build and execute update query
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id,
        mobile_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        marital_status,
        father_name,
        mother_name,
        email,
        address,
        city,
        state,
        country,
        zipcode,
        residential_status,
        duration_of_stay_years,
        duration_of_stay_months,
        number_of_dependents,
        educational_qualification,
        avatar,
        is_active,
        is_verified,
        created_by,
        created_at,
        updated_by,
        updated_at
    `;
    updateValues.push(userId);

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Build response with all fields (including null values)
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        mobileNumber: user.mobile_number,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        dateOfBirth: user.date_of_birth || null,
        gender: user.gender || null,
        maritalStatus: user.marital_status || null,
        fatherName: user.father_name || null,
        motherName: user.mother_name || null,
        email: user.email || null,
        address: user.address || null,
        city: user.city || null,
        state: user.state || null,
        country: user.country || null,
        zipcode: user.zipcode || null,
        residentialStatus: user.residential_status || null,
        durationOfStayYears: user.duration_of_stay_years ?? null,
        durationOfStayMonths: user.duration_of_stay_months ?? null,
        numberOfDependents: user.number_of_dependents ?? null,
        educationalQualification: user.educational_qualification || null,
        avatar: user.avatar || null,
        isActive: user.is_active ?? true,
        isVerified: user.is_verified ?? false,
        createdBy: user.created_by || null,
        createdAt: user.created_at || null,
        updatedBy: user.updated_by || null,
        updatedAt: user.updated_at || null
      }
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    next(error);
  }
};

/**
 * Get user profile
 * GET /api/profile
 * 
 * This endpoint is protected and requires authentication
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId; // From JWT token (set by auth middleware)

    const result = await query(
      `SELECT 
        id,
        mobile_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        marital_status,
        father_name,
        mother_name,
        email,
        address,
        city,
        state,
        country,
        zipcode,
        residential_status,
        duration_of_stay_years,
        duration_of_stay_months,
        number_of_dependents,
        educational_qualification,
        avatar,
        is_active,
        is_verified,
        created_by,
        created_at,
        updated_by,
        updated_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Build response with all fields (including null values)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        mobileNumber: user.mobile_number,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        dateOfBirth: user.date_of_birth || null,
        gender: user.gender || null,
        maritalStatus: user.marital_status || null,
        fatherName: user.father_name || null,
        motherName: user.mother_name || null,
        email: user.email || null,
        address: user.address || null,
        city: user.city || null,
        state: user.state || null,
        country: user.country || null,
        zipcode: user.zipcode || null,
        residentialStatus: user.residential_status || null,
        durationOfStayYears: user.duration_of_stay_years ?? null,
        durationOfStayMonths: user.duration_of_stay_months ?? null,
        numberOfDependents: user.number_of_dependents ?? null,
        educationalQualification: user.educational_qualification || null,
        avatar: user.avatar || null,
        isActive: user.is_active ?? true,
        isVerified: user.is_verified ?? false,
        createdBy: user.created_by || null,
        createdAt: user.created_at || null,
        updatedBy: user.updated_by || null,
        updatedAt: user.updated_at || null
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    next(error);
  }
};

