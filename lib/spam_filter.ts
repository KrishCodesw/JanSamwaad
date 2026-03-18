import {Filter} from 'bad-words';

const filter=new Filter()

filter.addWords("shit","etc.")


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
    if (filter.isProfane(text)) {
    return { isSpam: true, reason: "Description contains inappropriate language or prohibited keywords." };
  }
  return { isSpam: false,reason:"All checks passed!" };
}