const words_to_be_eliminated=["shit","etc."]

export function FilterSpamRegex(description:string):{isSpam:boolean;reason:string}{
    const text=description.toLocaleLowerCase().trim()
    if(text.length<10){
        return {isSpam:true,reason:"Description is too short. Please provide more details."}
    }
    if (text.length > 15 && !text.includes(" ")) {
    return { isSpam: true, reason: "Description appears to be invalid or gibberish." };
  }
    if(/(.)\1{4,}/.test(text)){
     return { isSpam: true, reason: "Description contains excessive repeating characters." };
    }
    const containsBadWords = words_to_be_eliminated.some(word => text.includes(word));
  if (containsBadWords) {
    return { isSpam: true, reason: "Description contains inappropriate language." };
  }
  return { isSpam: false,reason:"All checks passed!" };
}