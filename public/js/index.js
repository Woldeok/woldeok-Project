async function fetchSchoolCode() {
    const educationOfficeCode = document.getElementById("educationOffice").value;
    const schoolName = document.getElementById("schoolName").value;

    if (!educationOfficeCode) return alert("📌 교육청을 선택하세요.");
    if (!schoolName) return alert("📌 학교명을 입력하세요.");

    try {
        const response = await fetch(`/api/school?educationOfficeCode=${educationOfficeCode}&schoolName=${schoolName}`);
        const data = await response.json();

        if (data.schoolCode) {
            localStorage.setItem("educationOfficeCode", data.educationOfficeCode);
            localStorage.setItem("schoolCode", data.schoolCode);
            document.getElementById("mealContainer").classList.remove("hidden");
            alert("✅ 학교 코드가 설정되었습니다. 기간을 선택하고 급식을 조회하세요.");
        } else {
            // ✅ 사용자가 선택한 교육청에 학교가 없을 경우, 다른 교육청 확인 요청
            alert(`⚠️ 선택한 교육청(${educationOfficeCode})에 해당 학교가 없습니다.\n\n다른 교육청을 선택하여 다시 검색해 보세요.`);
        }
    } catch (error) {
        alert("❌ 오류 발생: " + error.message);
    }
}



async function fetchWeeklyMeal() {
    const educationOfficeCode = localStorage.getItem("educationOfficeCode");
    const schoolCode = localStorage.getItem("schoolCode");
    const startDateInput = document.getElementById("startDate").value;

    if (!educationOfficeCode || !schoolCode) return alert("학교 검색을 먼저 해주세요.");
    if (!startDateInput) return;

    const mealResultDiv = document.getElementById("mealResult");
    mealResultDiv.innerHTML = "";

    const startDate = new Date(startDateInput);
    const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

    for (let i = 0; i < 7; i++) {
        let currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const formattedDate = currentDate.toISOString().split("T")[0].replace(/-/g, "");
        const weekday = weekdayNames[currentDate.getDay()];

        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

        try {
            const response = await fetch(`/api/meal?educationOfficeCode=${educationOfficeCode}&schoolCode=${schoolCode}&date=${formattedDate}`);
            const data = await response.json();

            let menuText = data.length ? data[0].DDISH_NM.replace(/<br\/>/g, ", ") : "급식 정보 없음";

            const mealCard = document.createElement("div");
            mealCard.classList.add("meal-card");
            mealCard.innerHTML = `<h3>${weekday} (${formattedDate.slice(4, 6)}월 ${formattedDate.slice(6, 8)}일)</h3><p>${menuText}</p>`;
            mealResultDiv.appendChild(mealCard);
        } catch (error) {
            alert("오류 발생: " + error.message);
        }
    }
}
