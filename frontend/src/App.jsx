import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [student, setStudent] = useState({ name: 'Your Name', usn: 'Your USN' })

  useEffect(() => {
    fetch('http://localhost:5000/api/students')
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          setStudent(data[0])
        }
      })
      .catch((error) => {
        console.error('Error fetching student data:', error)
      })
  }, [])

  return (
    <div className="studentmart-page">
      <h1>StudentMart</h1>
      <p>Welcome to StudentMart</p>
      <p>Your Online Shopping Application</p>
      <p>
        Name: {student.name} USN: {student.usn}
      </p>
    </div>
  )
}

export default App
