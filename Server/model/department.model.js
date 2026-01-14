import { pool } from '../config/dbConn.js';

export const getAllDepartments = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM department WHERE is_deleted = 0"
  );
  return rows;
};

export const getDepartmentById = async (id) => {
    const [row] = await pool.query(
        "SELECT * FROM department WHERE depart_id = ?", [id]
    );
    return row[0];
};

export const departmentExists = async (department_code) => {
  const [rows] = await pool.query(
    "SELECT 1 FROM department WHERE department_code = ?",
    [department_code]
  );

  return rows.length > 0; 
};

export const createDepartment = async (data) => {
    const {department_code, name} = data;

    const [result] = await pool.query(
        "INSERT INTO department (department_code, name) VALUES (?, ?)",
        [department_code, name]
    );
    return result.insertId;
};

export const updateDepartment = async (id, data) => {
    const {department_code, name} = data;
    const [result] = await pool.query(
        `UPDATE department
        SET department_code = ?, name = ? 
        WHERE depart_id = ?
        `,
        [department_code, name, id]
    );
    return result.affectedRows;
};

export const deleteDepartment = async (id) => {
  const [result] = await pool.query(
    "UPDATE department SET is_deleted = 1 WHERE depart_id = ?",
    [id]
  );
  return result.affectedRows;
};

export const restoreDepartment = async (depart_id) => {
  const [result] = await pool.query(
    "UPDATE department SET is_deleted = 0 WHERE depart_id = ? AND is_deleted = 1",
    [depart_id]
  );
  return result.affectedRows;
};


export const getDeletedDepartments = async () => {
  const [rows] = await pool.query(
    "SELECT depart_id, department_code, name FROM department WHERE is_deleted = 1"
  );
  return rows;
};

