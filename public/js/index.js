async function fetchWeeklyMeal() {
    const educationOfficeCode = localStorage.getItem("educationOfficeCode");
    const schoolCode = localStorage.getItem("schoolCode");

    if (!educationOfficeCode || !schoolCode) return alert("학교 검색을 먼저 해주세요.");

    const mealResultDiv = document.getElementById("mealResult");
    mealResultDiv.innerHTML = ""; // 기존 결과 초기화

    const today = new Date();
    const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

    for (let i = 0; i < 7; i++) {
        let currentDate = new Date();
        currentDate.setDate(today.getDate() + i);
        const formattedDate = currentDate.toISOString().split("T")[0].replace(/-/g, "");
        const weekday = weekdayNames[currentDate.getDay()];

        // 주말(토,일) 제외
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

        try {
            const response = await fetch(`/api/meal?educationOfficeCode=${educationOfficeCode}&schoolCode=${schoolCode}&date=${formattedDate}`);
            const data = await response.json();

            if (data.length) {
                const menuItems = data[0].DDISH_NM.replace(/<br\/>/g, "").split(" ");
                const mealCard = document.createElement("div");
                mealCard.classList.add("meal-card");

                const mealTitle = document.createElement("h3");
                mealTitle.textContent = `${weekday} (${formattedDate.slice(4, 6)}월 ${formattedDate.slice(6, 8)}일) 급식`;
                mealCard.appendChild(mealTitle);

                menuItems.forEach(item => {
                    const mealItem = document.createElement("div");
                    mealItem.classList.add("meal-item");
                    mealItem.textContent = item.trim();
                    mealCard.appendChild(mealItem);
                });

                mealResultDiv.appendChild(mealCard);
            } else {
                const noMealCard = document.createElement("div");
                noMealCard.classList.add("meal-card");
                noMealCard.innerHTML = `<h3>${weekday} (${formattedDate.slice(4, 6)}월 ${formattedDate.slice(6, 8)}일)</h3><p>급식 정보 없음</p>`;
                mealResultDiv.appendChild(noMealCard);
            }
        } catch (error) {
            alert("오류 발생: " + error.message);
        }
    }
}
